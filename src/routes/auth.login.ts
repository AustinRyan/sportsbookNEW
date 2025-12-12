import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import * as bcrypt from 'bcryptjs'

import { jsonRes } from '@/server/jsonRes'
import { signUserToken } from '@/server/jwt'
import { ensureDefaultAdminUser, findUserByEmail } from '@/server/users'

const LoginBodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

export const Route = createFileRoute('/auth/login')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        await ensureDefaultAdminUser()
        const body = LoginBodySchema.safeParse(await request.json().catch(() => null))
        if (!body.success) {
          return jsonRes(
            { message: 'Invalid login data', issues: body.error.issues },
            { status: 400 },
          )
        }

        const user = await findUserByEmail(body.data.email)
        if (!user) {
          return jsonRes({ message: 'Invalid email or password' }, { status: 401 })
        }

        const ok = await bcrypt.compare(body.data.password, user.passwordHash)
        if (!ok) {
          return jsonRes({ message: 'Invalid email or password' }, { status: 401 })
        }

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
      },
    },
  },
})


