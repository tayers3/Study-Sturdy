import { createBrowserClient } from "@supabase/ssr";

let client: ReturnType<typeof createBrowserClient> | null = null;

function createMockQueryBuilder() {
  const result = Promise.resolve({ data: null, error: null });

  const builder = {
    select() {
      return builder;
    },
    insert() {
      return result;
    },
    update() {
      return builder;
    },
    delete() {
      return builder;
    },
    eq() {
      return result;
    },
    single() {
      return result;
    },
  };

  return builder;
}

export function createClient() {
  if (client) return client;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return {
      auth: {
        getUser: async () => ({ data: { user: null }, error: null }),
        signOut: async () => ({ error: null }),
        signInAnonymously: async () => ({ error: { message: "Supabase is not configured." } }),
        signInWithPassword: async () => ({ error: { message: "Supabase is not configured." } }),
        signUp: async () => ({ error: { message: "Supabase is not configured." } }),
      },
      from: () => createMockQueryBuilder(),
    } as any;
  }

  client = createBrowserClient(
    supabaseUrl,
    supabaseAnonKey
  );

  return client;
}
