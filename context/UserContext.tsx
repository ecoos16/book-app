import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "./AuthContext";

export type AppUser = {
  id: string;
  name: string;
  firstName?: string;
  lastName?: string;
  username?: string;
  email?: string;
  avatar?: string;
  bio?: string;
  birthDate?: string;
  favoriteGenres?: string[];
  favoriteAuthors?: string[];
  favoriteBook?: string;
  readingMood?: string;
  bookValue?: string;
  readerType?: string;
  yearlyGoal?: number | null;
  onboardingCompleted?: boolean;
};

type UpdateUserInput = Partial<Omit<AppUser, "id">>;

type UserContextType = {
  user: AppUser;
  loading: boolean;
  refreshUser: () => Promise<void>;
  setUser: (updates: UpdateUserInput) => Promise<{ error: string | null }>;
};

const DEFAULT_USER: AppUser = {
  id: "",
  name: "Misafir",
  firstName: "",
  lastName: "",
  username: "",
  email: "",
  avatar: undefined,
  bio: "",
  birthDate: undefined,
  favoriteGenres: [],
  favoriteAuthors: [],
  favoriteBook: "",
  readingMood: "",
  bookValue: "",
  readerType: "",
  yearlyGoal: null,
  onboardingCompleted: false,
};

type ProfileRow = {
  id: string;
  email: string | null;
  full_name: string | null;
  first_name: string | null;
  last_name: string | null;
  username: string | null;
  avatar_url: string | null;
  bio: string | null;
  birth_date: string | null;
  favorite_genres: string[] | null;
  favorite_authors: string[] | null;
  favorite_book: string | null;
  reading_mood: string | null;
  book_value: string | null;
  reader_type: string | null;
  yearly_goal: number | null;
  onboarding_completed: boolean | null;
};

const UserContext = createContext<UserContextType | null>(null);

function mapProfileToUser(profile: ProfileRow): AppUser {
  const firstName = profile.first_name ?? "";
  const lastName = profile.last_name ?? "";
  const fullName =
    profile.full_name?.trim() ||
    `${firstName} ${lastName}`.trim() ||
    profile.username?.trim() ||
    "Misafir";

  return {
    id: profile.id,
    name: fullName,
    firstName,
    lastName,
    username: profile.username ?? "",
    email: profile.email ?? "",
    avatar: profile.avatar_url ?? undefined,
    bio: profile.bio ?? "",
    birthDate: profile.birth_date ?? undefined,
    favoriteGenres: profile.favorite_genres ?? [],
    favoriteAuthors: profile.favorite_authors ?? [],
    favoriteBook: profile.favorite_book ?? "",
    readingMood: profile.reading_mood ?? "",
    bookValue: profile.book_value ?? "",
    readerType: profile.reader_type ?? "",
    yearlyGoal: profile.yearly_goal ?? null,
    onboardingCompleted: profile.onboarding_completed ?? false,
  };
}

export function UserProvider({ children }: { children: React.ReactNode }) {
  const { user: authUser } = useAuth();

  const [user, setUserState] = useState<AppUser>(DEFAULT_USER);
  const [loading, setLoading] = useState(true);

  const refreshUser = async () => {
    if (!authUser?.id) {
      setUserState(DEFAULT_USER);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const { data, error } = await supabase
        .from("profiles")
        .select(
          `
          id,
          email,
          full_name,
          first_name,
          last_name,
          username,
          avatar_url,
          bio,
          birth_date,
          favorite_genres,
          favorite_authors,
          favorite_book,
          reading_mood,
          book_value,
          reader_type,
          yearly_goal,
          onboarding_completed
        `,
        )
        .eq("id", authUser.id)
        .single();

      if (error) {
        console.log("USER PROFILE FETCH ERROR:", error);

        setUserState({
          ...DEFAULT_USER,
          id: authUser.id,
          name:
            authUser.user_metadata?.full_name ||
            authUser.email ||
            "ReadSphere Kullanıcısı",
          email: authUser.email ?? "",
        });
        return;
      }

      setUserState(mapProfileToUser(data as ProfileRow));
    } catch (err) {
      console.log("USER PROFILE FETCH CATCH ERROR:", err);

      setUserState({
        ...DEFAULT_USER,
        id: authUser.id,
        name:
          authUser.user_metadata?.full_name ||
          authUser.email ||
          "ReadSphere Kullanıcısı",
        email: authUser.email ?? "",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, [authUser?.id]);

  const setUser = async (
    updates: UpdateUserInput,
  ): Promise<{ error: string | null }> => {
    if (!authUser?.id) {
      return { error: "Oturum açık değil." };
    }

    try {
      const nextFirstName =
        updates.firstName !== undefined
          ? updates.firstName.trim()
          : (user.firstName ?? "");

      const nextLastName =
        updates.lastName !== undefined
          ? updates.lastName.trim()
          : (user.lastName ?? "");

      const nextFullName =
        updates.name?.trim() ||
        `${nextFirstName} ${nextLastName}`.trim() ||
        user.name ||
        "Misafir";

      const payload = {
        full_name: nextFullName,
        first_name:
          updates.firstName !== undefined
            ? nextFirstName
            : (user.firstName ?? null),
        last_name:
          updates.lastName !== undefined
            ? nextLastName
            : (user.lastName ?? null),
        username:
          updates.username !== undefined
            ? updates.username.trim() || null
            : user.username || null,
        avatar_url:
          updates.avatar !== undefined
            ? updates.avatar || null
            : user.avatar || null,
        bio: updates.bio !== undefined ? updates.bio || null : user.bio || null,
        birth_date:
          updates.birthDate !== undefined
            ? updates.birthDate || null
            : user.birthDate || null,
        favorite_genres:
          updates.favoriteGenres !== undefined
            ? updates.favoriteGenres
            : (user.favoriteGenres ?? []),
        favorite_authors:
          updates.favoriteAuthors !== undefined
            ? updates.favoriteAuthors
            : (user.favoriteAuthors ?? []),
        favorite_book:
          updates.favoriteBook !== undefined
            ? updates.favoriteBook || null
            : user.favoriteBook || null,
        reading_mood:
          updates.readingMood !== undefined
            ? updates.readingMood || null
            : user.readingMood || null,
        book_value:
          updates.bookValue !== undefined
            ? updates.bookValue || null
            : user.bookValue || null,
        reader_type:
          updates.readerType !== undefined
            ? updates.readerType || null
            : user.readerType || null,
        yearly_goal:
          updates.yearlyGoal !== undefined
            ? updates.yearlyGoal
            : (user.yearlyGoal ?? null),
        onboarding_completed:
          updates.onboardingCompleted !== undefined
            ? updates.onboardingCompleted
            : (user.onboardingCompleted ?? false),
      };

      const { error } = await supabase
        .from("profiles")
        .update(payload)
        .eq("id", authUser.id);

      if (error) {
        console.log("USER PROFILE UPDATE ERROR:", error);
        return { error: error.message };
      }

      await refreshUser();
      return { error: null };
    } catch (err: any) {
      console.log("USER PROFILE UPDATE CATCH ERROR:", err);
      return {
        error: err?.message ?? "Kullanıcı bilgileri güncellenemedi.",
      };
    }
  };

  const value = useMemo<UserContextType>(
    () => ({
      user,
      loading,
      refreshUser,
      setUser,
    }),
    [user, loading],
  );

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUser() {
  const ctx = useContext(UserContext);

  if (!ctx) {
    throw new Error("useUser must be used inside UserProvider");
  }

  return ctx;
}
