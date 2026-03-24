// context/UserContext.tsx

import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

/**
 * Basit kullanıcı modeli
 *
 * Şu an MVP düzeyinde:
 * - name zorunlu
 * - avatar opsiyonel
 *
 * İleride email, bio, username gibi alanlar eklenebilir.
 */
type User = {
  name: string;
  avatar?: string;
};

/**
 * Context dışına açılacak yapı
 */
type UserContextType = {
  user: User;
  setUser: (u: User) => void;
};

/**
 * AsyncStorage key
 */
const KEY = "USER_V1";

/**
 * Context oluştur
 */
const UserContext = createContext<UserContextType | null>(null);

export function UserProvider({ children }: { children: React.ReactNode }) {
  /**
   * Varsayılan kullanıcı
   *
   * Eğer storage'da kullanıcı yoksa
   * uygulama "Misafir" olarak açılır.
   */
  const [user, setUserState] = useState<User>({ name: "Misafir" });

  /**
   * İlk açılışta storage'dan kullanıcı bilgisini yükle
   */
  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const raw = await AsyncStorage.getItem(KEY);

        if (!mounted) return;
        if (!raw) return;

        const parsed = JSON.parse(raw) as Partial<User>;

        /**
         * Güvenli veri kontrolü
         */
        if (typeof parsed?.name === "string" && parsed.name.trim().length > 0) {
          setUserState({
            name: parsed.name.trim(),
            avatar:
              typeof parsed.avatar === "string" && parsed.avatar.length > 0
                ? parsed.avatar
                : undefined,
          });
        }
      } catch {
        /**
         * Hata olursa varsayılan kullanıcı ile devam et
         */
        setUserState({ name: "Misafir" });
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  /**
   * Kullanıcıyı güncelle ve storage'a kaydet
   */
  const setUser = (u: User) => {
    const nextUser: User = {
      name:
        typeof u.name === "string" && u.name.trim().length > 0
          ? u.name.trim()
          : "Misafir",
      avatar:
        typeof u.avatar === "string" && u.avatar.length > 0
          ? u.avatar
          : undefined,
    };

    setUserState(nextUser);

    AsyncStorage.setItem(KEY, JSON.stringify(nextUser)).catch(() => {
      // sessiz geç
    });
  };

  /**
   * Context value
   */
  const value = useMemo<UserContextType>(
    () => ({
      user,
      setUser,
    }),
    [user],
  );

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

/**
 * Context hook
 */
export function useUser() {
  const ctx = useContext(UserContext);

  if (!ctx) {
    throw new Error("useUser must be used inside UserProvider");
  }

  return ctx;
}
