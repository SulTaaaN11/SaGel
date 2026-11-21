// جلسة الإدارة: توكن موقّع HMAC-SHA256 (Web Crypto) يعمل في Node وEdge.
// الشكل: "<انتهاء-بالثواني>.<توقيع>"

export const ADMIN_COOKIE = 'adm_session';
export const ADMIN_SESSION_TTL = 60 * 60 * 8; // 8 ساعات

const enc = new TextEncoder();

function toBase64Url(bytes: Uint8Array): string {
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function sign(secret: string, data: string): Promise<string> {
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(data));
  return toBase64Url(new Uint8Array(sig));
}

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function createAdminToken(secret: string, ttlSeconds = ADMIN_SESSION_TTL): Promise<string> {
  const exp = Math.floor(Date.now() / 1000) + ttlSeconds;
  return `${exp}.${await sign(secret, `admin.${exp}`)}`;
}

export async function verifyAdminToken(token: string | undefined, secret: string): Promise<boolean> {
  if (!token) return false;
  const [expRaw, sig] = token.split('.');
  const exp = Number(expRaw);
  if (!sig || !Number.isInteger(exp) || exp <= Math.floor(Date.now() / 1000)) return false;
  return constantTimeEqual(sig, await sign(secret, `admin.${exp}`));
}
