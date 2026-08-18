import crypto from "crypto";

/* ─── RFC 4648 Base32 alphabet & decoder ─── */
const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

function base32Decode(encoded: string): Buffer {
  const cleaned = encoded.toUpperCase().replace(/=+$/, "").replace(/[^A-Z2-7]/g, "");
  let bits = 0;
  let value = 0;
  const output: number[] = [];

  for (let i = 0; i < cleaned.length; i++) {
    const idx = ALPHABET.indexOf(cleaned[i]);
    if (idx === -1) continue;
    value = (value << 5) | idx;
    bits += 5;

    if (bits >= 8) {
      output.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }

  return Buffer.from(output);
}

function base32Encode(buffer: Buffer): string {
  let bits = 0;
  let value = 0;
  let output = "";

  for (let i = 0; i < buffer.length; i++) {
    value = (value << 8) | buffer[i];
    bits += 8;

    while (bits >= 5) {
      output += ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }

  if (bits > 0) {
    output += ALPHABET[(value << (5 - bits)) & 31];
  }

  return output;
}

export const totp = {
  generateSecret(length = 20): string {
    const randomBuffer = crypto.randomBytes(length);
    return base32Encode(randomBuffer);
  },

  generateOTP(secret: string, timeStep = 30): string {
    const key = base32Decode(secret);
    const counter = Math.floor(Date.now() / 1000 / timeStep);
    const buffer = Buffer.alloc(8);

    for (let i = 7; i >= 0; i--) {
      buffer[i] = counter & 0xff;
      // Use right shift safely for 64-bit integer simulation
    }
    // High 32 bits
    const high = Math.floor(counter / 0x100000000);
    const low = counter & 0xffffffff;
    buffer.writeUInt32BE(high, 0);
    buffer.writeUInt32BE(low, 4);

    const hmac = crypto.createHmac("sha1", key).update(buffer).digest();
    const offset = hmac[hmac.length - 1] & 0xf;
    const code =
      ((hmac[offset] & 0x7f) << 24) |
      ((hmac[offset + 1] & 0xff) << 16) |
      ((hmac[offset + 2] & 0xff) << 8) |
      (hmac[offset + 3] & 0xff);

    const otp = (code % 1000000).toString().padStart(6, "0");
    return otp;
  },

  verifyOTP(code: string, secret: string, window = 1): boolean {
    if (!code || code.length !== 6) return false;
    const now = Math.floor(Date.now() / 1000 / 30);

    for (let i = -window; i <= window; i++) {
      const timeStepCounter = now + i;
      const buffer = Buffer.alloc(8);
      const high = Math.floor(timeStepCounter / 0x100000000);
      const low = timeStepCounter & 0xffffffff;
      buffer.writeUInt32BE(high, 0);
      buffer.writeUInt32BE(low, 4);

      const key = base32Decode(secret);
      const hmac = crypto.createHmac("sha1", key).update(buffer).digest();
      const offset = hmac[hmac.length - 1] & 0xf;
      const numCode =
        ((hmac[offset] & 0x7f) << 24) |
        ((hmac[offset + 1] & 0xff) << 16) |
        ((hmac[offset + 2] & 0xff) << 8) |
        (hmac[offset + 3] & 0xff);

      const generated = (numCode % 1000000).toString().padStart(6, "0");
      if (generated === code) return true;
    }

    return false;
  },

  keyuri(email: string, issuer: string, secret: string): string {
    const encodedEmail = encodeURIComponent(email);
    const encodedIssuer = encodeURIComponent(issuer);
    return `otpauth://totp/${encodedIssuer}:${encodedEmail}?secret=${secret}&issuer=${encodedIssuer}&algorithm=SHA1&digits=6&period=30`;
  },
};
