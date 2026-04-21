// context/AuthContext.tsx

import type { Session, User } from "@supabase/supabase-js";
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { supabase } from "../lib/supabase";

type SignUpParams = {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
};

type SignInResult = {
  error: string | null;
};

type SignUpResult = {
  error: string | null;
  userId: string | null;
};

type AuthContextType = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<SignInResult>;
  signUp: (params: SignUpParams) => Promise<SignUpResult>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const init = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();

        console.log("GET SESSION DATA:", data);
        console.log("GET SESSION ERROR:", error);

        if (!isMounted) return;

        const currentSession = data.session ?? null;
        setSession(currentSession);
        setUser(currentSession?.user ?? null);

        console.log("INITIAL USER:", currentSession?.user?.id ?? null);
      } catch (err) {
        console.log("GET SESSION CATCH ERROR:", err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    init();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, newSession) => {
      console.log("AUTH STATE EVENT:", event);
      console.log("AUTH STATE SESSION:", newSession);
      console.log("AUTH CHANGED USER:", newSession?.user?.id ?? null);

      if (!isMounted) return;

      setSession(newSession ?? null);
      setUser(newSession?.user ?? null);
      setLoading(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (
    email: string,
    password: string,
  ): Promise<SignInResult> => {
    try {
      const trimmedEmail = email.trim();
      const trimmedPassword = password.trim();

      if (!trimmedEmail || !trimmedPassword) {
        return { error: "Email ve şifre zorunludur." };
      }

      setLoading(true);

      const { data, error } = await supabase.auth.signInWithPassword({
        email: trimmedEmail,
        password: trimmedPassword,
      });

      console.log("SIGN IN DATA:", data);
      console.log("SIGN IN ERROR:", error);

      if (error) {
        return { error: error.message };
      }

      const currentSession = data.session ?? null;
      setSession(currentSession);
      setUser(currentSession?.user ?? null);

      console.log("SIGNED IN USER:", currentSession?.user?.id ?? null);

      return { error: null };
    } catch (err: any) {
      console.log("SIGN IN CATCH ERROR:", err);
      return {
        error: err?.message ?? "Giriş sırasında beklenmeyen bir hata oluştu.",
      };
    } finally {
      setLoading(false);
    }
  };

  const signUp = async ({
    email,
    password,
    firstName,
    lastName,
  }: SignUpParams): Promise<SignUpResult> => {
    try {
      const trimmedEmail = email.trim();
      const trimmedPassword = password.trim();
      const trimmedFirstName = firstName?.trim() ?? "";
      const trimmedLastName = lastName?.trim() ?? "";
      const fullName = `${trimmedFirstName} ${trimmedLastName}`.trim();

      if (!trimmedEmail || !trimmedPassword) {
        return {
          error: "Email ve şifre zorunludur.",
          userId: null,
        };
      }

      setLoading(true);

      console.log("SIGN UP BAŞLADI:", {
        email: trimmedEmail,
        firstName: trimmedFirstName,
        lastName: trimmedLastName,
      });

      const { data, error } = await supabase.auth.signUp({
        email: trimmedEmail,
        password: trimmedPassword,
        options: {
          data: {
            full_name: fullName,
            first_name: trimmedFirstName,
            last_name: trimmedLastName,
          },
        },
      });

      console.log("SIGN UP DATA:", data);
      console.log("SIGN UP ERROR:", error);

      if (error) {
        return {
          error: error.message,
          userId: null,
        };
      }

      const currentSession = data.session ?? null;

      if (currentSession) {
        setSession(currentSession);
        setUser(currentSession.user ?? null);
        console.log("SIGNED UP USER:", currentSession.user?.id ?? null);
      } else {
        console.log("SIGNED UP USER:", data.user?.id ?? null);
      }

      return {
        error: null,
        userId: data.user?.id ?? null,
      };
    } catch (err: any) {
      console.log("SIGN UP CATCH ERROR:", err);
      return {
        error: err?.message ?? "Kayıt sırasında beklenmeyen bir hata oluştu.",
        userId: null,
      };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      console.log("SIGN OUT STARTED");
      setLoading(true);

      const { error } = await supabase.auth.signOut();
      console.log("SIGN OUT ERROR:", error);

      if (error) {
        throw error;
      }

      setSession(null);
      setUser(null);

      console.log("SIGNED OUT USER");
    } catch (err) {
      console.log("SIGN OUT CATCH ERROR:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const value = useMemo<AuthContextType>(
    () => ({
      user,
      session,
      loading,
      signIn,
      signUp,
      signOut,
    }),
    [user, session, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}
