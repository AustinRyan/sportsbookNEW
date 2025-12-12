import { SignJWT, jwtVerify } from 'jose'

const JWT_SECRET = process.env.JWT_SECRET ?? 'dev-only-change-me'
const JWT_SECRET_BYTES = new TextEncoder().encode(JWT_SECRET)

export type JwtClaims = {
  sub: string
}

export async function signUserToken(userId: string) {
  return await new SignJWT({})
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(JWT_SECRET_BYTES)
}

export async function verifyUserToken(token: string): Promise<JwtClaims> {
  const { payload } = await jwtVerify(token, JWT_SECRET_BYTES)
  const sub = payload.sub
  if (typeof sub !== 'string' || !sub) {
    throw new Error('Invalid token')
  }
  return { sub }
}

export function getBearerToken(req: Request): string | null {
  const raw = req.headers.get('authorization')
  if (!raw) return null
  const [kind, token] = raw.split(' ')
  if (kind?.toLowerCase() !== 'bearer') return null
  return token ?? null
}


