import crypto from 'node:crypto'

import * as bcrypt from 'bcryptjs'

import { readJsonFile, writeJsonFile } from '@/server/jsonDb'

export type StoredUser = {
  id: string
  email: string
  firstName: string
  lastName: string
  displayName: string
  passwordHash: string
  balanceCents: number
  isAdmin: boolean
  createdAt: string
}

const USERS_FILE = 'users.json'

const DEFAULT_ADMIN = {
  email: 'admin@test.com',
  password: 'admin69420',
  firstName: 'Admin',
  lastName: 'User',
} as const

export async function ensureDefaultAdminUser() {
  const raw = await readJsonFile<Array<Partial<StoredUser>>>(USERS_FILE, [])
  const normalizedEmail = DEFAULT_ADMIN.email.toLowerCase()
  const idx = raw.findIndex((u) => u?.email?.toLowerCase() === normalizedEmail)

  if (idx !== -1) {
    // ensure admin flag is true
    const existing = raw[idx] ?? {}
    if (!existing.isAdmin) {
      raw[idx] = { ...existing, isAdmin: true }
      await writeJsonFile(USERS_FILE, raw)
    }
    return
  }

  const passwordHash = await bcrypt.hash(DEFAULT_ADMIN.password, 10)
  const user: StoredUser = {
    id: crypto.randomUUID(),
    email: normalizedEmail,
    firstName: DEFAULT_ADMIN.firstName,
    lastName: DEFAULT_ADMIN.lastName,
    displayName: `${DEFAULT_ADMIN.firstName} ${DEFAULT_ADMIN.lastName}`.trim(),
    passwordHash,
    balanceCents: 100_000,
    isAdmin: true,
    createdAt: new Date().toISOString(),
  }

  raw.push(user)
  await writeJsonFile(USERS_FILE, raw)
}

export async function listUsers(): Promise<StoredUser[]> {
  await ensureDefaultAdminUser()
  const raw = await readJsonFile<Array<Partial<StoredUser>>>(USERS_FILE, [])
  return raw
    .filter((u): u is Partial<StoredUser> & { id: string; email: string } =>
      Boolean(u?.id && u?.email),
    )
    .map((u) => {
      const displayName =
        typeof u.displayName === 'string' && u.displayName.trim()
          ? u.displayName.trim()
          : u.email.split('@')[0] ?? 'User'

      const [maybeFirst, ...rest] = displayName.split(' ')
      const firstName =
        typeof u.firstName === 'string' && u.firstName.trim()
          ? u.firstName.trim()
          : maybeFirst ?? ''
      const lastName =
        typeof u.lastName === 'string' && u.lastName.trim()
          ? u.lastName.trim()
          : rest.join(' ').trim()

      return {
        id: u.id!,
        email: u.email!.trim().toLowerCase(),
        firstName,
        lastName,
        displayName,
        passwordHash: u.passwordHash ?? '',
        balanceCents: typeof u.balanceCents === 'number' ? u.balanceCents : 0,
        isAdmin: Boolean(u.isAdmin),
        createdAt: u.createdAt ?? new Date().toISOString(),
      }
    })
}

export async function findUserByEmail(
  email: string,
): Promise<StoredUser | null> {
  const users = await listUsers()
  const normalized = email.trim().toLowerCase()
  return users.find((u) => u.email === normalized) ?? null
}

export async function findUserById(id: string): Promise<StoredUser | null> {
  const users = await listUsers()
  return users.find((u) => u.id === id) ?? null
}

export async function createUser(input: {
  email: string
  firstName: string
  lastName: string
  passwordHash: string
  startingBalanceCents: number
}): Promise<StoredUser> {
  const users = await listUsers()
  const normalizedEmail = input.email.trim().toLowerCase()

  if (users.some((u) => u.email === normalizedEmail)) {
    throw new Error('Email already in use')
  }

  const displayName = `${input.firstName} ${input.lastName}`.trim()

  const user: StoredUser = {
    id: crypto.randomUUID(),
    email: normalizedEmail,
    firstName: input.firstName.trim(),
    lastName: input.lastName.trim(),
    displayName: displayName || normalizedEmail.split('@')[0]!,
    passwordHash: input.passwordHash,
    balanceCents: input.startingBalanceCents,
    isAdmin: false,
    createdAt: new Date().toISOString(),
  }

  users.push(user)
  await writeJsonFile(USERS_FILE, users)

  return user
}

export async function updateUserBalanceCents(input: {
  userId: string
  balanceCents: number
}) {
  const users = await listUsers()
  const idx = users.findIndex((u) => u.id === input.userId)
  if (idx === -1) throw new Error('User not found')
  users[idx] = { ...users[idx], balanceCents: input.balanceCents }
  await writeJsonFile(USERS_FILE, users)
  return users[idx]
}


