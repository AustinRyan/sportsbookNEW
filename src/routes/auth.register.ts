import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import * as bcrypt from 'bcryptjs'

import { jsonRes } from '@/server/jsonRes'
import { signUserToken } from '@/server/jwt'
import { createUser, ensureDefaultAdminUser } from '@/server/users'

const RegisterBodySchema = z.object({
  firstName: z.string().min(1).max(32),
  lastName: z.string().min(1).max(32),
  email: z.string().email(),
  password: z.string().min(8),
})

export const Route = createFileRoute('/auth/register')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        await ensureDefaultAdminUser()
        const body = RegisterBodySchema.safeParse(await request.json().catch(() => null))
        if (!body.success) {
          return jsonRes(
            { message: 'Invalid registration data', issues: body.error.issues },
            { status: 400 },
          )
        }

        try {
          const passwordHash = await bcrypt.hash(body.data.password, 10)
          const user = await createUser({
            email: body.data.email,
            firstName: body.data.firstName,
            lastName: body.data.lastName,
            passwordHash,
            startingBalanceCents: 100_000,
          })

          const token = await signUserToken(user.id)

          return jsonRes({
            token,
            user: {
              id: user.id,
              email: user.email,
              displayName: user.displayName,
              balanceCents: user.balanceCents,
            },
          })
        } catch (err) {
          const msg = err instanceof Error ? err.message : 'Registration failed'
          const status = msg.toLowerCase().includes('email already in use') ? 409 : 500
          return jsonRes({ message: msg }, { status })
        }
      },
    },
  },
})


