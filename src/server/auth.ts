import { jsonRes } from '@/server/jsonRes'
import { getBearerToken, verifyUserToken } from '@/server/jwt'
import { findUserById } from '@/server/users'

export async function requireUser(request: Request) {
  const token = getBearerToken(request)
  if (!token) {
    return { error: jsonRes({ message: 'Missing Authorization header' }, { status: 401 }) } as const
  }

  let userId: string
  try {
    userId = (await verifyUserToken(token)).sub
  } catch {
    return { error: jsonRes({ message: 'Invalid token' }, { status: 401 }) } as const
  }

  const user = await findUserById(userId)
  if (!user) {
    return { error: jsonRes({ message: 'User not found' }, { status: 404 }) } as const
  }

  return { user } as const
}

export async function requireAdmin(request: Request) {
  const authed = await requireUser(request)
  if ('error' in authed) return authed
  if (!authed.user.isAdmin) {
    return { error: jsonRes({ message: 'Admin access required' }, { status: 403 }) } as const
  }
  return authed
}


