import crypto from "crypto";

/** Cryptographically strong 6-digit numeric code (school verification, etc). */
export const generateNumericCode = (length = 6): string => {
  const digits = "0123456789";
  let code = "";
  for (let i = 0; i < length; i++) {
    code += digits[crypto.randomInt(0, digits.length)];
  }
  return code;
};

/** Human-typable shared password for Housemasters, e.g. "house-willow-4821". */
export const generateSharedPassword = (): string => {
  const words = ["harbor", "willow", "meadow", "amber", "crest", "cedar", "orbit", "quartz"];
  const word = words[crypto.randomInt(0, words.length)];
  const num = crypto.randomInt(1000, 9999);
  return `house-${word}-${num}`;
};

/** Secure random token, e.g. for refresh tokens. */
export const generateToken = (bytes = 48): string => crypto.randomBytes(bytes).toString("hex");
