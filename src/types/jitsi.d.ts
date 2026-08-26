// Minimal ambient typings for the Jitsi Meet External API.
//
// The API script is loaded at runtime from https://meet.jit.si/external_api.js
// (public meet.jit.si instance — no API key or package dependency needed), so
// only the small surface the clinic app uses is declared here.

declare interface JitsiMeetExternalApiOptions {
  /** Room name on the Jitsi domain. Assigned server-side per consultation. */
  roomName: string;
  /** Element the conference iframe is mounted into. */
  parentNode: HTMLElement;
  width?: string | number | undefined;
  height?: string | number | undefined;
  userInfo?: {
    displayName?: string | undefined;
    email?: string | undefined;
  };
  /** Jitsi config overrides, e.g. startWithVideoMuted for audio-first calls. */
  configOverwrite?: Record<string, unknown>;
  interfaceConfigOverwrite?: Record<string, unknown>;
  lang?: string | undefined;
}

declare class JitsiMeetExternalAPI {
  constructor(domain: string, options?: JitsiMeetExternalApiOptions);
  /** e.g. "hangup", "toggleAudio", "toggleVideo". */
  executeCommand(name: string, ...args: unknown[]): void;
  addEventListeners(listeners: Record<string, (event?: unknown) => void>): void;
  removeEventListener(name: string): void;
  /** Leaves the room and removes the conference iframe. */
  dispose(): void;
}

interface Window {
  JitsiMeetExternalAPI?: typeof JitsiMeetExternalAPI;
}
