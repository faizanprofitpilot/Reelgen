import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(key) {
          return cookieStore.get(key)?.value;
        },
        set(key, value, options) {
          try {
            cookieStore.set(key, value, options);
          } catch {
            // Called from a Server Component where setting cookies is not allowed.
          }
        },
        remove(key, options) {
          try {
            cookieStore.set(key, "", { ...options, maxAge: 0 });
          } catch {
            // Called from a Server Component where setting cookies is not allowed.
          }
        },
      },
    }
  );
}

export function createServiceRoleClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        get() {
          return null;
        },
        set() {
          // no-op
        },
        remove() {
          // no-op
        },
      },
    }
  );
}
