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
    let isActive = true;

    const initializeAuth = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();

        console.log("GET SESSION DATA:", data);
        console.log("GET SESSION ERROR:", error);

        if (!isActive) return;

        setSession(data.session ?? null);
        setUser(data.session?.user ?? null);
      } catch (err) {
        console.log("GET SESSION CATCH ERROR:", err);
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, newSession) => {
      console.log("AUTH STATE EVENT:", event);
      console.log("AUTH STATE SESSION:", newSession);

      if (!isActive) return;

      setSession(newSession ?? null);
      setUser(newSession?.user ?? null);
      setLoading(false);
    });

    return () => {
      isActive = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (
    email: string,
    password: string,
  ): Promise<SignInResult> => {
    try {
      const trimmedEmail = email.trim();

      if (!trimmedEmail || !password.trim()) {
        return { error: "Email ve şifre zorunludur." };
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: trimmedEmail,
        password,
      });

      console.log("SIGN IN DATA:", data);
      console.log("SIGN IN ERROR:", error);

      if (error) {
        return { error: error.message };
      }

      return { error: null };
    } catch (err: any) {
      console.log("SIGN IN CATCH ERROR:", err);
      return {
        error: err?.message ?? "Giriş sırasında beklenmeyen bir hata oluştu.",
      };
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
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      console.log("SIGN OUT ERROR:", error);

      if (error) {
        console.log("Çıkış yapılırken hata oluştu:", error.message);
      }
    } catch (err) {
      console.log("SIGN OUT CATCH ERROR:", err);
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
