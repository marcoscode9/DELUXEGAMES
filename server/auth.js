import { randomBytes, scrypt, timingSafeEqual, createHash, randomUUID } from 'node:crypto';
import { promisify } from 'node:util';
const derive = promisify(scrypt);
export const hashToken = token => createHash('sha256').update(token).digest('hex');
export async function passwordHash(password) {
  const salt = randomBytes(16).toString('hex');
  const hash = await derive(password, salt, 64, { N: 32768, maxmem: 64 * 1024 * 1024 });
  return `${salt}:${hash.toString('hex')}`;
}
export async function verifyPassword(password, stored) {
  const [salt, hex] = stored.split(':');
  const hash = await derive(password, salt, 64, { N: 32768, maxmem: 64 * 1024 * 1024 });
  return timingSafeEqual(hash, Buffer.from(hex, 'hex'));
}
export const publicUser = u => ({ id: u.id, name: u.name, email: u.email, role: u.role });
export async function createSession(db, user, res, secure) {
  const token = randomBytes(32).toString('hex'), csrf = randomBytes(32).toString('hex');
  await db.query("DELETE FROM sessions WHERE expires_at < NOW()");
  await db.query("INSERT INTO sessions(token_hash,user_id,csrf,expires_at) VALUES ($1,$2,$3,NOW()+INTERVAL '7 days')", [hashToken(token),user.id,csrf]);
  res.setHeader('Set-Cookie', `dg_session=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=604800${secure ? '; Secure' : ''}`);
  return { user: publicUser(user), csrf };
}
export async function getSession(db, req) {
  const token = (req.headers.cookie || '').match(/(?:^|;\s*)dg_session=([a-f0-9]{64})(?:;|$)/)?.[1];
  if (!token) return null;
  const result = await db.query('SELECT u.*,s.csrf,s.token_hash FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=$1 AND s.expires_at>NOW()', [hashToken(token)]);
  return result.rows[0] || null;
}
export async function bootstrapAdmin(db, email, password, name = 'Administrador') {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || password.length < 12) throw new Error('Email válido y contraseña de al menos 12 caracteres requeridos.');
  const result = await db.query('INSERT INTO users(id,email,name,password_hash,role) VALUES ($1,$2,$3,$4,$5) ON CONFLICT(email) DO NOTHING RETURNING id', [randomUUID(),email.trim().toLowerCase(),name,await passwordHash(password),'admin']);
  if (!result.rowCount) throw new Error('Ya existe una cuenta con ese email. No se modificó.');
}
