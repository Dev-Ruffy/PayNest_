import crypto from "crypto";
import { env } from "../config/env";

const ALGORITHM = "aes-256-gcm";

// Derive a stable 32-byte key from the configured secret.
const KEY = crypto.createHash("sha256").update(env.PIN_ENCRYPTION_KEY).digest();

/**
 * Reversible encryption — used ONLY for the student PIN "view" recovery
 * feature available to School Admins. Authentication never uses this;
 * login always checks the bcrypt hash instead.
 */
export function encryptSecret(plainText: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);
  const encrypted = Buffer.concat([cipher.update(plainText, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return [iv.toString("hex"), authTag.toString("hex"), encrypted.toString("hex")].join(":");
}

export function decryptSecret(payload: string): string {
  const [ivHex, authTagHex, encryptedHex] = payload.split(":");
  const decipher = crypto.createDecipheriv(ALGORITHM, KEY, Buffer.from(ivHex, "hex"));
  decipher.setAuthTag(Buffer.from(authTagHex, "hex"));
  const decrypted = Buffer.concat([decipher.update(Buffer.from(encryptedHex, "hex")), decipher.final()]);
  return decrypted.toString("utf8");
}
