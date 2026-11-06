import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase, supabaseConfigured } from "@/lib/supabase";

type AdminAuthValue = {
  session: Session | null;
  loading: boolean;
  configured: boolean;
  signIn: (email: string, password: string) => Promise<string | null>;
  signOut: () => Promise<string | null>;
};

const AdminAuthContext = createContext<AdminAuthValue | null>(null);

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (mounted) {
        setSession(data.session);
        setLoading(false);
      }
    });
    const { data } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      setLoading(false);
    });
    return () => {
      mounted = false;
      data.subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<AdminAuthValue>(() => ({
    session,
    loading,
    configured: supabaseConfigured,
    signIn: async (email, password) => {
      if (!supabase) return "لم يتم إعداد اتصال Supabase.";
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      return error?.message ?? null;
    },
    signOut: async () => {
      if (!supabase) return "لم يتم إعداد اتصال Supabase.";
      const { error } = await supabase.auth.signOut();
      return error?.message ?? null;
    },
  }), [loading, session]);

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
}

export function useAdminAuth() {
  const value = useContext(AdminAuthContext);
  if (!value) throw new Error("useAdminAuth يجب أن يُستخدم داخل AdminAuthProvider");
  return value;
}
