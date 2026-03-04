import { createBrowserClient, parse, serialize } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(key) {
          if (typeof document === "undefined") return null;
          const cookies = parse(document.cookie ?? "");
          return cookies[key];
        },
        set(key, value, options) {
          if (typeof document === "undefined") return;
          document.cookie = serialize(key, value, { path: "/", ...options });
        },
        remove(key, options) {
          if (typeof document === "undefined") return;
          document.cookie = serialize(key, "", {
            path: "/",
            ...options,
            maxAge: 0,
          });
        },
      },
    }
  );
}
