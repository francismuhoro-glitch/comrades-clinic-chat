/**
 * Zero-dependency Web Push sender — RFC 8291 (aes128gcm) + RFC 8292 (VAPID).
 *
 * SERVER-ONLY: imports node:crypto. Always loaded through a dynamic import
 * inside a server function handler so it never reaches the client bundle.
 *
 * Implemented with node:crypto alone (no npm web-push dependency, no external
 * push service beyond the browser vendors' push endpoints):
 *  - VAPID: ES256 JWT signed with the P-256 private key (DER→raw r||s).
 *  - Payload: ECDH P-256 + HKDF-SHA256 → AES-128-GCM records (aes128gcm).
 */

import {
  createCipheriv,
  createECDH,
  createPrivateKey,
  hkdfSync,
  randomBytes,
  sign,
} from "node:crypto";

function b64url(input: Buffer): string {
  return input.toString("base64url");
}

function b64urlDecode(input: string): Buffer {
  return Buffer.from(input, "base64url");
}

export interface VapidKeys {
  publicKey: string;
  privateKey: string;
}

/** Build the RFC 8292 `Authorization: vapid …` header for one endpoint. */
export function vapidHeaderFor(endpoint: string, keys: VapidKeys, subject: string): string {
  const endpointUrl = new URL(endpoint);
  const header = b64url(Buffer.from(JSON.stringify({ typ: "JWT", alg: "ES256" })));
  const payload = b64url(
    Buffer.from(
      JSON.stringify({
        aud: endpointUrl.origin,
        exp: Math.floor(Date.now() / 1000) + 12 * 60 * 60,
        sub: subject,
      }),
    ),
  );
  const signingInput = `${header}.${payload}`;

  const publicJwk = b64urlDecode(keys.publicKey); // 0x04 || X || Y
  const x = publicJwk.subarray(1, 33).toString("base64url");
  const y = publicJwk.subarray(33, 65).toString("base64url");
  const keyObject = createPrivateKey({
    key: { kty: "EC", crv: "P-256", x, y, d: keys.privateKey },
    format: "jwk",
  });
  // ieee-p1363 = JOSE raw r||s (64 bytes) — exactly what VAPID requires.
  const signature = sign("sha256", Buffer.from(signingInput), {
    key: keyObject,
    dsaEncoding: "ieee-p1363",
  });

  return `vapid t=${signingInput}.${b64url(signature)}, k=${keys.publicKey}`;
}

const RS = 4096; // record size (RFC 8188 default)
const OVERHEAD = 17; // 16-byte GCM tag + 1 padding delimiter

/** HKDF via node's one-shot API. */
function hkdf(ikm: Buffer, salt: Buffer, info: Buffer, length: number): Buffer {
  return Buffer.from(hkdfSync("sha256", ikm, salt, info, length));
}

/**
 * Encrypt a payload for one push subscription (aes128gcm content coding).
 * Returns the full request body, or null when the subscription keys are bad.
 */
export function encryptForSubscription(
  p256dh: string,
  auth: string,
  payload: Buffer,
): Buffer | null {
  try {
    const uaPublic = b64urlDecode(p256dh);
    if (uaPublic.length !== 65 || uaPublic[0] !== 0x04) return null;

    const ecdh = createECDH("prime256v1");
    ecdh.generateKeys();
    const asPublic = ecdh.getPublicKey();
    const secret = ecdh.computeSecret(uaPublic);

    const salt = randomBytes(16);
    const keyInfo = Buffer.concat([Buffer.from("WebPush: info\0", "binary"), uaPublic, asPublic]);
    const nonceInfo = Buffer.concat([
      Buffer.from("Content-Encoding: nonce\0", "binary"),
      uaPublic,
      asPublic,
    ]);
    const cek = hkdf(secret, salt, keyInfo, 16);
    const nonce = hkdf(secret, salt, nonceInfo, 12);

    // Single record: payload || 0x02 (end-of-record delimiter), padded to fit.
    const maxPayload = RS - OVERHEAD;
    if (payload.length > maxPayload) return null;
    const record = Buffer.alloc(payload.length + 1);
    payload.copy(record, 0);
    record[payload.length] = 0x02;

    const cipher = createCipheriv("aes-128-gcm", cek, nonce);
    const ciphertext = Buffer.concat([cipher.update(record), cipher.final(), cipher.getAuthTag()]);

    return Buffer.concat([
      salt,
      (() => {
        const rs = Buffer.alloc(4);
        rs.writeUInt32BE(RS);
        return rs;
      })(),
      Buffer.from([asPublic.length]),
      asPublic,
      ciphertext,
    ]);
  } catch {
    return null;
  }
}

/** Send one encrypted push. Returns the HTTP status, or 0 on local failure. */
export async function sendWebPushMessage(options: {
  endpoint: string;
  p256dh: string;
  auth: string;
  payload: Buffer;
  vapid: VapidKeys;
  subject: string;
  ttlSeconds?: number;
}): Promise<number> {
  const body = encryptForSubscription(options.p256dh, options.auth, options.payload);
  if (!body) return 0;
  try {
    const response = await fetch(options.endpoint, {
      method: "POST",
      headers: {
        Authorization: vapidHeaderFor(options.endpoint, options.vapid, options.subject),
        "Content-Encoding": "aes128gcm",
        "Content-Type": "application/octet-stream",
        TTL: String(options.ttlSeconds ?? 24 * 60 * 60),
        Urgency: "normal",
      },
      body: new Uint8Array(body),
    });
    return response.status;
  } catch {
    return 0;
  }
}
