import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

function createMockQueryBuilder() {
  const result = Promise.resolve({ data: null, error: null });

  const builder = {
    select() {
      return builder;
    },
    insert() {
      return builder;
    },
    update() {
      return builder;
    },
    delete() {
      return builder;
    },
    eq() {
      return builder;
    },
    order() {
      return result;
    },
    single() {
      return result;
    },
    then(onFulfilled?: (value: { data: null; error: null }) => unknown, onRejected?: (reason: unknown) => unknown) {
      return result.then(onFulfilled, onRejected);
    },
  };

  return builder;
}

export async function createClient() {
  const cookieStore = await cookies();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return {
      auth: {
        getUser: async () => ({ data: { user: null }, error: null }),
      },
      from: () => createMockQueryBuilder(),
    } as any;
  }

  return createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  );
}
