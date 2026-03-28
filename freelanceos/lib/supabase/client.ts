import { createBrowserClient } from '@supabase/ssr'

let cachedClient: ReturnType<typeof createBrowserClient> | null = null

export function createClient() {
  if (cachedClient) return cachedClient

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) {
    // Return a client that won't make network requests in demo mode
    cachedClient = createBrowserClient(
      'https://placeholder.supabase.co',
      'placeholder-key',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
          detectSessionInUrl: false,
        },
        global: {
          fetch: (...args) => {
            // Block all network requests to the placeholder URL
            return Promise.resolve(new Response(JSON.stringify({ data: null, error: null }), {
              status: 200,
              headers: { 'Content-Type': 'application/json' },
            }))
          },
        },
      }
    )
    return cachedClient
  }
  cachedClient = createBrowserClient(url, key)
  return cachedClient
}
