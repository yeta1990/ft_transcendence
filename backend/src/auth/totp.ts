import * as crypto from 'crypto';

function base32ToBuffer(base32: string): Buffer {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'; // Base32 alphabet
  const base32Buffer = Buffer.from(base32);
  const result = Buffer.alloc(Math.ceil((base32Buffer.length * 5) / 8));
  let resultOffset = 0;
  let bits = 0;
  let value = 0;

  for (let i = 0; i < base32Buffer.length; i++) {
    const currentChar = base32Buffer.toString('utf-8')[i];
    const charValue = alphabet.indexOf(currentChar);

    if (charValue === -1) {
      throw new Error('Invalid character in base32 string');
    }

    value = (value << 5) | charValue;
    bits += 5;

    if (bits >= 8) {
      result.writeUInt8((value >> (bits - 8)) & 0xff, resultOffset++);
      bits -= 8;
    }
  }

  return result;
}

function generateTOTP(secret: string, time?: number): string {
  if (time === undefined) {
    time = Math.floor(Date.now() / 1000); // Calcula el tiempo actual en segundos si no se proporciona
  }
  const key = base32ToBuffer(secret); // Convierte el secreto de base32 a búfer
  const counter = Buffer.alloc(8);
  
  for (let i = 7; i >= 0; i--) {
    counter.writeUInt8((time >> (i * 8)) & 0xff, i);
  }

  const hmac = crypto.createHmac('sha1', key);
  hmac.update(counter);

  const hash = hmac.digest();
  const offset = hash[hash.length - 1] & 0xf;
  const truncatedHash = (hash.readUInt32BE(offset) & 0x7fffffff) % 1000000;

  return truncatedHash.toString().padStart(6, '0');
}

export function isValidTOTP(token, secret) {
  const timeInterval = 30;
  const windows = 2;
  const currentTime = Math.floor(Date.now() / 1000);
  for (let i = -windows; i <= windows; i++) {
    const time = Math.floor(currentTime / timeInterval) + i;
    const code = generateTOTP(secret, time); // Genera el código TOTP con el secreto y el tiempo
    if (code === token) {
      return true;
    }
  }
  return false;
}

export function generateUniqueRC(count: number): string[] {
  const recoveryCodes = [];
  for (let i = 0; i < count; i++) {
    const code = generateRandomAlphanumericCode(12); // Genera un código alfanumérico de 12 caracteres
    recoveryCodes.push(code);
  }
  return recoveryCodes;
}

function generateRandomAlphanumericCode(length: number): string {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let code = '';
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length);
    code += charset[randomIndex];
  }
  return code;
}

export function generateSecret(): string {
  const base32chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'; // Caracteres válidos para el formato base32
  const secretLength = 16; // Longitud del secreto en caracteres
  let secret = '';

  for (let i = 0; i < secretLength; i++) {
    const randomIndex = crypto.randomInt(0, base32chars.length);
    secret += base32chars[randomIndex];
  }

  return secret;
}
