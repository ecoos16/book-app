import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";

type User = {
  name: string;
  avatar?: string;
};

type UserContextType = {
  user: User;
  setUser: (u: User) => void;
};

const KEY = "USER_V1";

const UserContext = createContext<UserContextType | null>(null);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUserState] = useState<User>({ name: "Misafir" });

  useEffect(() => {
    AsyncStorage.getItem(KEY).then((raw) => {
      if (raw) setUserState(JSON.parse(raw));
    });
  }, []);

  const setUser = (u: User) => {
    setUserState(u);
    AsyncStorage.setItem(KEY, JSON.stringify(u));
  };

  return (
    <UserContext.Provider value={{ user, setUser }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error("useUser must be used inside UserProvider");
  return ctx;
}
