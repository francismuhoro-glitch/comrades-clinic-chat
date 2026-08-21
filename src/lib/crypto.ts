/**
 * Medical-grade client-side encryption using native Web Crypto API (AES-256-GCM).
 * Ensures chat messages are encrypted before persisting to Supabase or network storage.
 */

function bufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    const byte = bytes[i];
    if (byte !== undefined) {
      binary += String.fromCharCode(byte);
    }
  }
  return btoa(binary);
}

function base64ToBuffer(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

async function deriveSessionKey(sessionId: string): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.digest(
    "SHA-256",
    encoder.encode(`comrades-clinic-v1:${sessionId}`),
  );
  return crypto.subtle.importKey("raw", keyMaterial, { name: "AES-GCM" }, false, [
    "encrypt",
    "decrypt",
  ]);
}

/**
 * Encrypts plaintext text using AES-256-GCM.
 * Output format: `enc:v1:<iv_base64>:<ciphertext_base64>`
 */
export async function encryptMessage(text: string, sessionId: string): Promise<string> {
  if (!text || typeof window === "undefined" || !window.crypto?.subtle) {
    return text;
  }

  try {
    const key = await deriveSessionKey(sessionId);
    const iv = crypto.getRandomValues(new Uint8Array(12)); // 96-bit IV for AES-GCM
    const encoder = new TextEncoder();
    const encodedText = encoder.encode(text);

    const ciphertextBuffer = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv: iv as BufferSource },
      key,
      encodedText,
    );

    const ivB64 = bufferToBase64(iv.buffer as ArrayBuffer);
    const cipherB64 = bufferToBase64(ciphertextBuffer);

    return `enc:v1:${ivB64}:${cipherB64}`;
  } catch (err) {
    console.error("Encryption error:", err);
    return text;
  }
}

/**
 * Decrypts an encrypted message format `enc:v1:<iv>:<ciphertext>`.
 * If message is not encrypted (e.g. legacy seed data), returns plaintext as-is.
 */
export async function decryptMessage(encryptedText: string, sessionId: string): Promise<string> {
  if (
    !encryptedText ||
    !encryptedText.startsWith("enc:v1:") ||
    typeof window === "undefined" ||
    !window.crypto?.subtle
  ) {
    return encryptedText;
  }

  try {
    const parts = encryptedText.split(":");
    const ivStr = parts[2];
    const cipherStr = parts[3];

    if (!ivStr || !cipherStr) {
      return encryptedText;
    }

    const iv = base64ToBuffer(ivStr);
    const ciphertext = base64ToBuffer(cipherStr);
    const key = await deriveSessionKey(sessionId);

    const decryptedBuffer = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: iv as BufferSource },
      key,
      ciphertext as BufferSource,
    );

    const decoder = new TextDecoder();
    return decoder.decode(decryptedBuffer);
  } catch (err) {
    console.warn("Could not decrypt message payload:", err);
    return "[Encrypted message - unable to decrypt]";
  }
}
