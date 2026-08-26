import { ExternalLink, Loader2, MessageSquare, PhoneOff, Video, VideoOff, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import type { ConsultSession } from "@/lib/clinic-types";
import { JITSI_DOMAIN, JITSI_EMBEDS_LIMITED, resolveVideoRoomName } from "@/lib/video-call";

interface VideoCallProps {
  consultation: ConsultSession;
  /** Which side opened the call — decides how the room name is resolved. */
  viewer: "doctor" | "patient";
  /** Display name shown to the other participant inside Jitsi. */
  displayName: string;
  onClose: () => void;
}

type CallPhase = "connecting" | "handoff" | "in_call" | "unavailable";

/** How long to wait for Jitsi to report a joined conference before giving up. */
const JOIN_TIMEOUT_MS = 30_000;

let jitsiScriptPromise: Promise<typeof JitsiMeetExternalAPI | null> | null = null;

/**
 * Lazily loads meet.jit.si's external API script (once per page). Resolves
 * null when the script cannot be fetched (offline / blocked) — the caller
 * then shows the "video unavailable, continue via chat" fallback.
 */
function loadJitsiScript(): Promise<typeof JitsiMeetExternalAPI | null> {
  jitsiScriptPromise ??= new Promise((resolve) => {
    if (window.JitsiMeetExternalAPI) {
      resolve(window.JitsiMeetExternalAPI);
      return;
    }
    const script = document.createElement("script");
    script.src = `https://${JITSI_DOMAIN}/external_api.js`;
    script.async = true;
    script.onload = () => resolve(window.JitsiMeetExternalAPI ?? null);
    script.onerror = () => resolve(null);
    document.head.appendChild(script);
  });
  return jitsiScriptPromise;
}

/**
 * On-request voice/video call overlay riding on public meet.jit.si.
 *
 * Audio-first: the room joins immediately (prejoin screen disabled) with the
 * camera off and mic on; an explicit "Enable video" toggle turns the camera
 * on. Leaving — or the consultation completing — hangs up and disposes the
 * Jitsi iframe. If the room or the Jitsi script cannot be reached within the
 * join timeout, a fallback explains why and offers "open in a new tab" plus
 * "continue via chat" (chat itself is untouched by this feature).
 */
export function VideoCall({ consultation, viewer, displayName, onClose }: VideoCallProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const apiRef = useRef<JitsiMeetExternalAPI | null>(null);
  const onCloseRef = useRef(onClose);

  const [phase, setPhase] = useState<CallPhase>("connecting");
  const [videoEnabled, setVideoEnabled] = useState(false);
  const [failReason, setFailReason] = useState<string>("");
  const [roomUrl, setRoomUrl] = useState<string | null>(null);
  // True once the Jitsi iframe exists. From that point the frame must stay
  // visible and clickable: meet.jit.si can render a CAPTCHA or consent prompt
  // that only the user can interact with, and covering it stalls the join.
  const [apiReady, setApiReady] = useState(false);

  // Resolved once per open call — realtime store patches must not re-create it.
  const consultationId = consultation.id;
  const [roomHint] = useState(consultation.video_room_name ?? null);

  useEffect(() => {
    onCloseRef.current = onClose;
  });

  /** Hang up + dispose the conference; safe to call more than once. */
  const hangUp = useCallback(() => {
    const api = apiRef.current;
    apiRef.current = null;
    if (!api) return;
    try {
      api.executeCommand("hangup");
    } catch {
      // The room may already be gone.
    }
    try {
      api.dispose();
    } catch {
      // The iframe may already be detached.
    }
  }, []);

  const leaveCall = useCallback(() => {
    hangUp();
    onCloseRef.current();
  }, [hangUp]);

  // Belt and braces: if the consultation completes while the overlay is still
  // mounted, end the call immediately. (Parents also unmount this component on
  // completion, and the join effect's cleanup hangs up on unmount.)
  useEffect(() => {
    if (consultation.status === "completed") {
      hangUp();
      onCloseRef.current();
    }
  }, [consultation.status, hangUp]);

  // Join once on mount; unmount always hangs up + disposes.
  useEffect(() => {
    let cancelled = false;

    // meet.jit.si disconnects *embedded* rooms after ~5 minutes, so on the
    // default domain we hand off to a normal browser tab instead (no limit,
    // works on every host and browser). Custom VITE_JITSI_DOMAIN instances
    // have no such policy and use the in-app embedded room below.
    if (JITSI_EMBEDS_LIMITED) {
      (async () => {
        const resolved = await resolveVideoRoomName(consultationId, viewer, roomHint);
        if (cancelled) return;
        if (!resolved.ok || !resolved.roomName) {
          setFailReason(resolved.reason ?? "The call could not be opened.");
          setPhase("unavailable");
          return;
        }
        setRoomUrl(`https://${JITSI_DOMAIN}/${resolved.roomName}`);
        setPhase("handoff");
      })();
      return () => {
        cancelled = true;
      };
    }

    let joined = false;
    const watchdog = window.setTimeout(() => {
      if (!cancelled && !joined) {
        hangUp();
        setFailReason(
          `The call room did not respond within ${JOIN_TIMEOUT_MS / 1000}s. ${JITSI_DOMAIN} may be asking for a CAPTCHA, or your network/browser (especially Safari private mode) is blocking the embedded room — try “Open in new tab”.`,
        );
        setPhase("unavailable");
      }
    }, JOIN_TIMEOUT_MS);

    (async () => {
      try {
        const resolved = await resolveVideoRoomName(consultationId, viewer, roomHint);
        if (cancelled) return;
        if (!resolved.ok || !resolved.roomName) {
          setFailReason(resolved.reason ?? "The call could not be opened.");
          setPhase("unavailable");
          return;
        }
        setRoomUrl(`https://${JITSI_DOMAIN}/${resolved.roomName}`);

        const JitsiApi = await loadJitsiScript();
        if (cancelled) return;
        if (!JitsiApi || !containerRef.current) {
          setFailReason(
            "The meet.jit.si service could not be loaded — check your internet connection.",
          );
          setPhase("unavailable");
          return;
        }

        const api = new JitsiApi(JITSI_DOMAIN, {
          roomName: resolved.roomName,
          parentNode: containerRef.current,
          userInfo: { displayName },
          configOverwrite: {
            // Audio-first: mic on, camera off until explicitly enabled.
            startWithAudioMuted: false,
            startWithVideoMuted: true,
            startScreenSharing: false,
            disableDeepLinking: true,
            // Join straight away — the prejoin screen would sit invisibly
            // behind the connecting overlay and block videoConferenceJoined.
            prejoinConfig: { enabled: false },
          },
          interfaceConfigOverwrite: {
            SHOW_JITSI_WATERMARK: false,
            MOBILE_APP_PROMO: false,
          },
        });
        apiRef.current = api;
        setApiReady(true);

        api.addEventListeners({
          videoConferenceJoined: () => {
            joined = true;
            window.clearTimeout(watchdog);
            if (!cancelled) setPhase("in_call");
          },
          // Fires after hangup (ours or theirs) once teardown completes.
          readyToClose: () => {
            if (!cancelled) {
              hangUp();
              onCloseRef.current();
            }
          },
          connectionFailed: () => {
            window.clearTimeout(watchdog);
            if (!cancelled) {
              hangUp();
              setFailReason("The connection to the call server failed. Please try again.");
              setPhase("unavailable");
            }
          },
        });
      } catch (err) {
        console.error("Video call failed:", err);
        if (!cancelled) {
          setFailReason("Something went wrong while opening the call. Please try again.");
          setPhase("unavailable");
        }
      }
    })();

    return () => {
      cancelled = true;
      window.clearTimeout(watchdog);
      hangUp();
    };
  }, [consultationId, roomHint, viewer, displayName, hangUp]);

  const toggleVideo = useCallback(() => {
    const api = apiRef.current;
    if (!api) return;
    try {
      api.executeCommand("toggleVideo");
      setVideoEnabled((v) => !v);
    } catch {
      // Ignore — camera state remains as shown by the Jitsi toolbar.
    }
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background/95 p-3 backdrop-blur-sm sm:p-6">
      <div className="mx-auto flex min-h-0 w-full max-w-4xl flex-1 flex-col overflow-hidden rounded-2xl border bg-card shadow-card">
        {/* Call header */}
        <div className="flex items-center justify-between gap-2 border-b px-4 py-2.5">
          <div className="flex min-w-0 items-center gap-2">
            <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Video className="size-3.5" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-xs font-bold">
                Voice/video call · {consultation.full_name}
              </p>
              <p className="text-[10px] text-muted-foreground">
                {phase === "in_call"
                  ? "Connected — audio first, video off by default"
                  : phase === "unavailable"
                    ? "Call unavailable"
                    : phase === "handoff"
                      ? "Call room ready — it opens in its own tab"
                      : "Connecting — allow microphone access if your browser asks"}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="size-8 shrink-0"
            onClick={leaveCall}
            aria-label="Leave call"
          >
            <X className="size-4" />
          </Button>
        </div>

        {/* Jitsi iframe mounts here. While the API loads a status card covers
            it; once the iframe exists it stays visible AND clickable — Jitsi
            may need the user to solve a CAPTCHA or consent prompt. */}
        <div ref={containerRef} className="relative min-h-0 flex-1 bg-black">
          {phase === "connecting" && !apiReady && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-card p-6 text-center">
              <Loader2 className="size-6 animate-spin text-primary" />
              <p className="text-xs font-medium text-muted-foreground">
                Opening a private call room…
              </p>
              <p className="max-w-xs text-[11px] leading-relaxed text-muted-foreground">
                If your browser asks for microphone access, choose Allow — the call starts
                audio-first with the camera off.
              </p>
            </div>
          )}
          {phase === "connecting" && roomUrl && (
            <Button
              size="sm"
              variant="outline"
              className="absolute right-3 top-3 z-10 gap-1.5 bg-card/90 text-[11px] font-bold shadow-card backdrop-blur"
              onClick={() => window.open(roomUrl, "_blank", "noopener")}
            >
              <ExternalLink className="size-3" />
              Open in new tab
            </Button>
          )}
          {phase === "handoff" && roomUrl && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 bg-card p-6 text-center">
              <span className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Video className="size-6" />
              </span>
              <div className="space-y-1">
                <p className="text-sm font-bold">Your call room is ready</p>
                <p className="mx-auto max-w-sm text-[11px] leading-relaxed text-muted-foreground">
                  meet.jit.si limits embedded calls to 5 minutes, so the room opens in its own
                  browser tab — no time limit and best quality. Keep this window open; leave the
                  call from the tab itself.
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-2">
                <Button
                  size="lg"
                  className="gap-2 rounded-xl text-sm font-bold"
                  onClick={() => window.open(roomUrl, "_blank", "noopener")}
                >
                  <ExternalLink className="size-4" />
                  Join call in new tab
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5 text-xs font-bold"
                  onClick={leaveCall}
                >
                  <MessageSquare className="size-3.5" />
                  Continue via chat
                </Button>
              </div>
            </div>
          )}

          {phase === "unavailable" && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-card p-6 text-center">
              <p className="max-w-xs text-xs font-semibold">Video isn't available right now.</p>
              {failReason && (
                <p className="max-w-xs text-[11px] leading-relaxed text-muted-foreground">
                  {failReason}
                </p>
              )}
              <div className="flex flex-wrap items-center justify-center gap-2">
                {roomUrl && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1.5 text-xs font-bold"
                    onClick={() => window.open(roomUrl, "_blank", "noopener")}
                  >
                    <ExternalLink className="size-3.5" />
                    Open in new tab
                  </Button>
                )}
                <Button size="sm" className="gap-1.5 text-xs font-bold" onClick={leaveCall}>
                  <MessageSquare className="size-3.5" />
                  Continue via chat
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Call controls (audio-first: camera starts off) */}
        {phase === "in_call" && (
          <div className="flex items-center justify-center gap-2 border-t px-4 py-2.5">
            <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={toggleVideo}>
              {videoEnabled ? <VideoOff className="size-3.5" /> : <Video className="size-3.5" />}
              {videoEnabled ? "Turn video off" : "Enable video"}
            </Button>
            <Button variant="destructive" size="sm" className="gap-1.5 text-xs" onClick={leaveCall}>
              <PhoneOff className="size-3.5" />
              Leave call
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
