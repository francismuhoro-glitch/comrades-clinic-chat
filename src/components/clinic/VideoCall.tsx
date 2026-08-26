import { Loader2, MessageSquare, PhoneOff, Video, VideoOff, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import type { ConsultSession } from "@/lib/clinic-types";
import { JITSI_DOMAIN, resolveVideoRoomName } from "@/lib/video-call";

interface VideoCallProps {
  consultation: ConsultSession;
  /** Which side opened the call — decides how the room name is resolved. */
  viewer: "doctor" | "patient";
  /** Display name shown to the other participant inside Jitsi. */
  displayName: string;
  onClose: () => void;
}

type CallPhase = "connecting" | "in_call" | "unavailable";

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
 * Audio-first: the room is joined with the camera off and an explicit
 * "Enable video" toggle turns it on. Leaving (or the consultation completing)
 * hangs up and disposes the Jitsi iframe. If the room or the Jitsi script
 * cannot be reached, a fallback invites the patient to continue via the
 * encrypted chat, which is untouched by this feature.
 */
export function VideoCall({ consultation, viewer, displayName, onClose }: VideoCallProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const apiRef = useRef<JitsiMeetExternalAPI | null>(null);
  const onCloseRef = useRef(onClose);

  const [phase, setPhase] = useState<CallPhase>("connecting");
  const [videoEnabled, setVideoEnabled] = useState(false);

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

    (async () => {
      try {
        const roomName = await resolveVideoRoomName(consultationId, viewer, roomHint);
        if (cancelled) return;
        if (!roomName) {
          setPhase("unavailable");
          return;
        }

        const JitsiApi = await loadJitsiScript();
        if (cancelled) return;
        if (!JitsiApi || !containerRef.current) {
          setPhase("unavailable");
          return;
        }

        const api = new JitsiApi(JITSI_DOMAIN, {
          roomName,
          parentNode: containerRef.current,
          userInfo: { displayName },
          configOverwrite: {
            // Audio-first: mic open, camera off until explicitly enabled.
            startWithAudioMuted: false,
            startWithVideoMuted: true,
            startScreenSharing: false,
            disableDeepLinking: true,
          },
          interfaceConfigOverwrite: {
            SHOW_JITSI_WATERMARK: false,
            MOBILE_APP_PROMO: false,
          },
        });
        apiRef.current = api;

        api.addEventListeners({
          videoConferenceJoined: () => {
            if (!cancelled) setPhase("in_call");
          },
          // Fires after hangup (ours or theirs) once teardown completes.
          readyToClose: () => {
            if (!cancelled) {
              hangUp();
              onCloseRef.current();
            }
          },
        });
      } catch (err) {
        console.error("Video call failed:", err);
        if (!cancelled) setPhase("unavailable");
      }
    })();

    return () => {
      cancelled = true;
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
                  : "Opening private call room…"}
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

        {/* Jitsi iframe mounts here; status / fallback layers sit on top. */}
        <div ref={containerRef} className="relative min-h-0 flex-1 bg-black">
          {phase !== "in_call" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-card p-6 text-center">
              {phase === "connecting" ? (
                <>
                  <Loader2 className="size-6 animate-spin text-primary" />
                  <p className="text-xs font-medium text-muted-foreground">
                    Opening a private call room…
                  </p>
                </>
              ) : (
                <div className="space-y-3">
                  <p className="max-w-xs text-xs font-semibold">Video isn't available right now.</p>
                  <p className="max-w-xs text-[11px] leading-relaxed text-muted-foreground">
                    The call couldn't be opened — your network may block meet.jit.si or the video
                    rooms migration hasn't been applied yet. Your encrypted chat is unaffected.
                  </p>
                  <Button size="sm" className="gap-1.5 text-xs" onClick={leaveCall}>
                    <MessageSquare className="size-3.5" />
                    Continue via chat
                  </Button>
                </div>
              )}
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
