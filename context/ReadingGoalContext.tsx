import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";

const KEY = "DAILY_GOAL";

type Ctx = {
  goal: number;
  setGoal: (n: number) => void;
};

const C = createContext<Ctx | null>(null);

export function ReadingGoalProvider({ children }: any) {
  const [goal, setGoalState] = useState(20);

  useEffect(() => {
    AsyncStorage.getItem(KEY).then((v) => {
      if (v) setGoalState(Number(v));
    });
  }, []);

  const setGoal = (n: number) => {
    setGoalState(n);
    AsyncStorage.setItem(KEY, String(n));
  };

  return <C.Provider value={{ goal, setGoal }}>{children}</C.Provider>;
}

export function useReadingGoal() {
  const ctx = useContext(C);
  if (!ctx) throw new Error("useReadingGoal provider yok");
  return ctx;
}
