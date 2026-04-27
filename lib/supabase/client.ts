import { createBrowserClient } from "@supabase/ssr";

let client: ReturnType<typeof createBrowserClient> | null = null;

const DEMO_CURRENT_USER_COOKIE = "study_sturdy_demo_current_user";
const DEMO_USERS_COOKIE = "study_sturdy_demo_users";
const DEMO_SESSIONS_COOKIE = "study_sturdy_demo_sessions";
const DEMO_NOTES_COOKIE = "study_sturdy_demo_notes";

type DemoUser = {
  id: string;
  is_anonymous: boolean;
  email: string | null;
  user_metadata: { full_name?: string };
};

type DemoStoredUser = DemoUser & {
  password: string;
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

function getCookie(name: string) {
  if (typeof document === "undefined") {
    return null;
  }

  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

function setCookie(name: string, value: string) {
  if (typeof document === "undefined") {
    return;
  }

  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=31536000; samesite=lax`;
}

function deleteCookie(name: string) {
  if (typeof document === "undefined") {
    return;
  }

  document.cookie = `${name}=; path=/; max-age=0; samesite=lax`;
}

function getDemoCurrentUser(): DemoUser | null {
  const raw = getCookie(DEMO_CURRENT_USER_COOKIE);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as DemoUser;
  } catch {
    return null;
  }
}

function saveDemoCurrentUser(user: DemoUser | null) {
  if (!user) {
    deleteCookie(DEMO_CURRENT_USER_COOKIE);
    return;
  }

  setCookie(DEMO_CURRENT_USER_COOKIE, JSON.stringify(user));
}

function getDemoUsers() {
  const raw = getCookie(DEMO_USERS_COOKIE);
  if (!raw) {
    return [] as DemoStoredUser[];
  }

  try {
    return JSON.parse(raw) as DemoStoredUser[];
  } catch {
    return [] as DemoStoredUser[];
  }
}

function saveDemoUsers(users: DemoStoredUser[]) {
  setCookie(DEMO_USERS_COOKIE, JSON.stringify(users));
}

function toPublicDemoUser(user: DemoStoredUser): DemoUser {
  return {
    id: user.id,
    is_anonymous: user.is_anonymous,
    email: user.email,
    user_metadata: user.user_metadata,
  };
}

function getDemoSessions() {
  const raw = getCookie(DEMO_SESSIONS_COOKIE);
  if (!raw) {
    return [] as DemoSession[];
  }

  try {
    return JSON.parse(raw) as DemoSession[];
  } catch {
    return [] as DemoSession[];
  }
}

function saveDemoSessions(sessions: DemoSession[]) {
  setCookie(DEMO_SESSIONS_COOKIE, JSON.stringify(sessions));
}

function getDemoNotes() {
  const raw = getCookie(DEMO_NOTES_COOKIE);
  if (!raw) {
    return [] as DemoNote[];
  }

  try {
    return JSON.parse(raw) as DemoNote[];
  } catch {
    return [] as DemoNote[];
  }
}

function saveDemoNotes(notes: DemoNote[]) {
  setCookie(DEMO_NOTES_COOKIE, JSON.stringify(notes));
}

function createMockQueryBuilder(table: string) {
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
      const rows = resolveReadRows();
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
      onFulfilled?: (value: { data: unknown; error: { message: string } | null }) => unknown,
      onRejected?: (reason: unknown) => unknown
    ) {
      return Promise.resolve(resolveResult()).then(onFulfilled, onRejected);
    },
  };

  function applyFilters<T extends Record<string, unknown>>(rows: T[]) {
    return state.filters.reduce(
      (filtered, filter) => filtered.filter((row) => row[filter.column] === filter.value),
      rows
    );
  }

  function insertSession() {
    const user = getDemoCurrentUser();
    if (!user) {
      return { data: null, error: { message: "You must be logged in to create a session" } };
    }

    const now = new Date().toISOString();
    const session: DemoSession = {
      id: crypto.randomUUID(),
      user_id: user.id,
      title: String(state.insertData?.title ?? "Untitled Session"),
      subject: (state.insertData?.subject as string | null | undefined) ?? null,
      description: (state.insertData?.description as string | null | undefined) ?? null,
      created_at: now,
      updated_at: now,
    };

    const sessions = getDemoSessions();
    sessions.unshift(session);
    saveDemoSessions(sessions);
    return { data: session, error: null };
  }

  function insertNote() {
    const user = getDemoCurrentUser();
    if (!user) {
      return { data: null, error: { message: "You must be logged in to save notes" } };
    }

    const now = new Date().toISOString();
    const note: DemoNote = {
      id: crypto.randomUUID(),
      session_id: String(state.insertData?.session_id ?? ""),
      user_id: String(state.insertData?.user_id ?? user.id),
      title: String(state.insertData?.title ?? "Untitled Note"),
      content: (state.insertData?.content as string | null | undefined) ?? null,
      file_url: (state.insertData?.file_url as string | null | undefined) ?? null,
      file_type: (state.insertData?.file_type as string | null | undefined) ?? null,
      created_at: now,
      updated_at: now,
    };

    const notes = getDemoNotes();
    notes.unshift(note);
    saveDemoNotes(notes);
    return { data: note, error: null };
  }

  function resolveReadRows() {
    if (table === "study_sessions") {
      return applyFilters(getDemoSessions());
    }

    if (table === "notes") {
      return applyFilters(getDemoNotes());
    }

    return [] as Array<Record<string, unknown>>;
  }

  function resolveResult() {
    if (table === "study_sessions" && state.action === "insert" && state.insertData) {
      const inserted = insertSession();
      return { data: inserted.data ? [inserted.data] : null, error: inserted.error };
    }

    if (table === "notes" && state.action === "insert" && state.insertData) {
      const inserted = insertNote();
      return { data: inserted.data ? [inserted.data] : null, error: inserted.error };
    }

    if (table === "notes" && state.action === "update" && state.updateData) {
      const now = new Date().toISOString();
      const updatedNotes = getDemoNotes().map((note) => {
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

      saveDemoNotes(updatedNotes);
      return { data: null, error: null };
    }

    if (table === "notes" && state.action === "delete") {
      const remainingNotes = getDemoNotes().filter(
        (note) => !state.filters.every((filter) => note[filter.column as keyof DemoNote] === filter.value)
      );
      saveDemoNotes(remainingNotes);
      return { data: null, error: null };
    }

    return { data: resolveReadRows(), error: null };
  }

  function resolveSingle() {
    if (table === "study_sessions" && state.action === "insert" && state.insertData) {
      return insertSession();
    }

    if (table === "notes" && state.action === "insert" && state.insertData) {
      return insertNote();
    }

    const rows = resolveReadRows();
    return { data: rows[0] ?? null, error: null };
  }

  return builder;
}

export function createClient() {
  if (client) return client;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return {
      auth: {
        getUser: async () => ({ data: { user: getDemoCurrentUser() }, error: null }),
        signOut: async () => {
          saveDemoCurrentUser(null);
          return { error: null };
        },
        signInAnonymously: async () => {
          const guestUser: DemoUser = {
            id: crypto.randomUUID(),
            is_anonymous: true,
            email: null,
            user_metadata: {},
          };
          saveDemoCurrentUser(guestUser);
          return { error: null };
        },
        signInWithPassword: async ({ email, password }: { email: string; password: string }) => {
          const user = getDemoUsers().find(
            (candidate) => candidate.email?.toLowerCase() === email.toLowerCase() && candidate.password === password
          );

          if (!user) {
            return { error: { message: "Invalid email or password." } };
          }

          saveDemoCurrentUser(toPublicDemoUser(user));
          return { error: null };
        },
        signUp: async ({
          email,
          password,
          options,
        }: {
          email: string;
          password: string;
          options?: { data?: { full_name?: string } };
        }) => {
          const users = getDemoUsers();
          const exists = users.some((candidate) => candidate.email?.toLowerCase() === email.toLowerCase());

          if (exists) {
            return { error: { message: "An account with this email already exists." } };
          }

          const newUser: DemoStoredUser = {
            id: crypto.randomUUID(),
            is_anonymous: false,
            email,
            password,
            user_metadata: {
              full_name: options?.data?.full_name,
            },
          };

          users.push(newUser);
          saveDemoUsers(users);
          saveDemoCurrentUser(toPublicDemoUser(newUser));

          return { error: null };
        },
      },
      from: (table: string) => createMockQueryBuilder(table),
    } as any;
  }

  client = createBrowserClient(
    supabaseUrl,
    supabaseAnonKey
  );

  return client;
}
