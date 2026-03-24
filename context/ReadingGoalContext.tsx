// context/ReadingGoalContext.tsx

import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

/**
 * AsyncStorage key'leri
 *
 * DAILY_GOAL  -> günlük hedef sayfa sayısı
 * READING_STEP -> hızlı ekleme adımı (+10 / +20 / +30 gibi)
 */
const KEY_GOAL = "DAILY_GOAL";
const KEY_STEP = "READING_STEP";

/**
 * Context dışına açılacak yapı
 */
type Ctx = {
  goal: number;
  setGoal: (n: number) => void;

  /**
   * Hızlı ekleme step değeri
   * Örn: kitap detayında +10 sayfa / +20 sayfa gibi
   */
  step: number;
  setStep: (n: number) => void;
};

/**
 * Context oluştur
 */
const C = createContext<Ctx | null>(null);

export function ReadingGoalProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  /**
   * Varsayılan değerler
   */
  const [goal, setGoalState] = useState<number>(20);
  const [step, setStepState] = useState<number>(10);

  /**
   * İlk açılışta hedef ve step değerini storage'dan yükle
   */
  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const [storedGoal, storedStep] = await Promise.all([
          AsyncStorage.getItem(KEY_GOAL),
          AsyncStorage.getItem(KEY_STEP),
        ]);

        if (!mounted) return;

        if (storedGoal) {
          const parsedGoal = Number(storedGoal);
          setGoalState(parsedGoal > 0 ? parsedGoal : 20);
        }

        if (storedStep) {
          const parsedStep = Number(storedStep);
          setStepState(parsedStep > 0 ? parsedStep : 10);
        }
      } catch {
        /**
         * Hata olursa varsayılan değerlerle devam et
         * Uygulama kırılmasın
         */
        setGoalState(20);
        setStepState(10);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  /**
   * Günlük hedef kaydet
   *
   * 1'den küçük değerlere izin verme
   */
  const setGoal = (n: number) => {
    const val = Math.max(1, Number(n) || 1);

    setGoalState(val);

    AsyncStorage.setItem(KEY_GOAL, String(val)).catch(() => {
      // sessiz geç
    });
  };

  /**
   * Hızlı ekleme step değerini kaydet
   *
   * 1'den küçük olmasın
   */
  const setStep = (n: number) => {
    const val = Math.max(1, Number(n) || 1);

    setStepState(val);

    AsyncStorage.setItem(KEY_STEP, String(val)).catch(() => {
      // sessiz geç
    });
  };

  /**
   * Context value
   *
   * useMemo ile gereksiz render azaltılır
   */
  const value = useMemo(
    () => ({
      goal,
      setGoal,
      step,
      setStep,
    }),
    [goal, step],
  );

  return <C.Provider value={value}>{children}</C.Provider>;
}

/**
 * Context hook
 */
export function useReadingGoal() {
  const ctx = useContext(C);

  if (!ctx) {
    throw new Error("useReadingGoal provider yok");
  }

  return ctx;
}
