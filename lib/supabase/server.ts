import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

const DEMO_CURRENT_USER_COOKIE = "study_sturdy_demo_current_user";
const DEMO_SESSIONS_COOKIE = "study_sturdy_demo_sessions";
const DEMO_NOTES_COOKIE = "study_sturdy_demo_notes";

type DemoUser = {
  id: string;
  is_anonymous: boolean;
  email: string | null;
  user_metadata: { full_name?: string };
};

type DemoSession = {
  id: string;
  user_id: string;
  title: string;
  subject: string | null;
  description: string | null;
  created_at: string;
  updated_at: string;
};

type DemoNote = {
  id: string;
  session_id: string;
  user_id: string;
  title: string;
  content: string | null;
  file_url: string | null;
  file_type: string | null;
  created_at: string;
  updated_at: string;
};

function parseDemoSessions(raw: string | undefined) {
  if (!raw) {
    return [] as DemoSession[];
  }

  try {
    return JSON.parse(raw) as DemoSession[];
  } catch {
    return [] as DemoSession[];
  }
}

function parseDemoNotes(raw: string | undefined) {
  if (!raw) {
    return [] as DemoNote[];
  }

  try {
    return JSON.parse(raw) as DemoNote[];
  } catch {
    return [] as DemoNote[];
  }
}

function parseDemoCurrentUser(raw: string | undefined) {
  if (!raw) {
    return null as DemoUser | null;
  }

  try {
    return JSON.parse(raw) as DemoUser;
  } catch {
    return null as DemoUser | null;
  }
}

function createMockQueryBuilder(
  table: string,
  sessions: DemoSession[],
  notes: DemoNote[],
  setNotes: (nextNotes: DemoNote[]) => void
) {
  const state: {
    filters: Array<{ column: string; value: unknown }>;
    insertData: Record<string, unknown> | null;
    updateData: Record<string, unknown> | null;
    action: "read" | "insert" | "update" | "delete";
  } = {
    filters: [],
    insertData: null,
    updateData: null,
    action: "read",
  };

  const builder = {
    select() {
      if (state.action === "read") {
        state.action = "read";
      }
      return builder;
    },
    insert(values: Record<string, unknown>) {
      state.action = "insert";
      state.insertData = values;
      return builder;
    },
    update(values: Record<string, unknown>) {
      state.action = "update";
      state.updateData = values;
      return builder;
    },
    delete() {
      state.action = "delete";
      return builder;
    },
    eq(column: string, value: unknown) {
      state.filters.push({ column, value });
      return builder;
    },
    order(column: string, options?: { ascending?: boolean }) {
      const rows = resolveMany();
      rows.sort((left, right) => {
        const leftValue = String((left as Record<string, unknown>)[column] ?? "");
        const rightValue = String((right as Record<string, unknown>)[column] ?? "");
        return options?.ascending === false
          ? rightValue.localeCompare(leftValue)
          : leftValue.localeCompare(rightValue);
      });
      return Promise.resolve({ data: rows, error: null });
    },
    single() {
      return Promise.resolve(resolveSingle());
    },
    then(
      onFulfilled?: (value: { data: Array<DemoSession | DemoNote>; error: null }) => unknown,
      onRejected?: (reason: unknown) => unknown
    ) {
      return Promise.resolve({ data: resolveMany(), error: null }).then(onFulfilled, onRejected);
    },
  };

  function applyFilters<T extends Record<string, unknown>>(rows: T[]) {
    return state.filters.reduce(
      (filtered, filter) => filtered.filter((row) => row[filter.column] === filter.value),
      rows
    );
  }

  function saveInsertedNote() {
    const userId = String(state.insertData?.user_id ?? "");
    if (!userId) {
      return null;
    }

    const now = new Date().toISOString();
    const note: DemoNote = {
      id: crypto.randomUUID(),
      session_id: String(state.insertData?.session_id ?? ""),
      user_id: userId,
      title: String(state.insertData?.title ?? "Untitled Note"),
      content: (state.insertData?.content as string | null | undefined) ?? null,
      file_url: (state.insertData?.file_url as string | null | undefined) ?? null,
      file_type: (state.insertData?.file_type as string | null | undefined) ?? null,
      created_at: now,
      updated_at: now,
    };

    const nextNotes = [note, ...notes];
    setNotes(nextNotes);
    notes = nextNotes;

    return note;
  }

  function resolveMany() {
    if (table === "notes" && state.action === "update" && state.updateData) {
      const now = new Date().toISOString();
      const nextNotes = notes.map((note) => {
        const matches = state.filters.every((filter) => note[filter.column as keyof DemoNote] === filter.value);
        if (!matches) {
          return note;
        }

        return {
          ...note,
          ...state.updateData,
          updated_at: now,
        } as DemoNote;
      });

      setNotes(nextNotes);
      notes = nextNotes;
      return applyFilters(nextNotes);
    }

    if (table === "notes" && state.action === "delete") {
      const nextNotes = notes.filter(
        (note) => !state.filters.every((filter) => note[filter.column as keyof DemoNote] === filter.value)
      );

      setNotes(nextNotes);
      notes = nextNotes;
      return [] as DemoNote[];
    }

    if (table === "study_sessions") {
      return applyFilters(sessions);
    }

    if (table === "notes") {
      return applyFilters(notes);
    }

    return [] as DemoSession[];
  }

  function resolveSingle() {
    if (table === "notes" && state.insertData) {
      const inserted = saveInsertedNote();
      return { data: inserted, error: null };
    }

    const rows = resolveMany();
    return { data: rows[0] ?? null, error: null };
  }

  return builder;
}

export async function createClient() {
  const cookieStore = await cookies();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    const demoUser = parseDemoCurrentUser(cookieStore.get(DEMO_CURRENT_USER_COOKIE)?.value);
    const demoSessions = parseDemoSessions(cookieStore.get(DEMO_SESSIONS_COOKIE)?.value);
    const demoNotes = parseDemoNotes(cookieStore.get(DEMO_NOTES_COOKIE)?.value);

    const setDemoNotes = (nextNotes: DemoNote[]) => {
      try {
        cookieStore.set(DEMO_NOTES_COOKIE, JSON.stringify(nextNotes), {
          path: "/",
          maxAge: 31536000,
          sameSite: "lax",
        });
      } catch {
        // Safe to ignore in server components where cookies are read-only.
      }
    };

    return {
      auth: {
        getUser: async () => ({ data: { user: demoUser }, error: null }),
      },
      from: (table: string) => createMockQueryBuilder(table, demoSessions, demoNotes, setDemoNotes),
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
