import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

const KEY_GOAL = "DAILY_GOAL";
const KEY_STEP = "READING_STEP";

type Ctx = {
  goal: number;
  setGoal: (n: number) => void;

  // ✅ Hızlı ekleme adımı (+10/+20/+30...)
  step: number;
  setStep: (n: number) => void;
};

const C = createContext<Ctx | null>(null);

export function ReadingGoalProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [goal, setGoalState] = useState<number>(20);
  const [step, setStepState] = useState<number>(10);

  // ✅ İlk açılışta hedef + step’i AsyncStorage’dan çek
  useEffect(() => {
    (async () => {
      const g = await AsyncStorage.getItem(KEY_GOAL);
      if (g) setGoalState(Number(g) || 20);

      const s = await AsyncStorage.getItem(KEY_STEP);
      if (s) setStepState(Number(s) || 10);
    })();
  }, []);

  // ✅ hedef kaydet
  const setGoal = (n: number) => {
    const val = Math.max(1, Number(n) || 1);
    setGoalState(val);
    AsyncStorage.setItem(KEY_GOAL, String(val)).catch(() => {});
  };

  // ✅ step kaydet
  const setStep = (n: number) => {
    const val = Math.max(1, Number(n) || 1);
    setStepState(val);
    AsyncStorage.setItem(KEY_STEP, String(val)).catch(() => {});
  };

  const value = useMemo(() => ({ goal, setGoal, step, setStep }), [goal, step]);

  return <C.Provider value={value}>{children}</C.Provider>;
}

export function useReadingGoal() {
  const ctx = useContext(C);
  if (!ctx) throw new Error("useReadingGoal provider yok");
  return ctx;
}
