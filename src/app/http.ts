import { getToken } from '@/app/auth/token'

export type ApiError = {
  message: string
}

export async function apiFetch<T>(
  path: string,
  init?: Omit<RequestInit, 'headers'> & { headers?: Record<string, string> },
): Promise<T> {
  const token = getToken()

  const res = await fetch(path, {
    ...init,
    headers: {
      'content-type': 'application/json',
      ...(token ? { authorization: `Bearer ${token}` } : {}),
      ...(init?.headers ?? {}),
    },
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    let message = `Request failed (${res.status})`
    try {
      const parsed = JSON.parse(text) as Partial<ApiError>
      if (parsed?.message) message = parsed.message
    } catch {
      if (text) message = text
    }
    throw new Error(message)
  }

  return (await res.json()) as T
}


