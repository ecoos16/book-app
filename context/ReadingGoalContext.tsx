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
 * ✅ Kullanıcının okuma ayarları
 * goal: günlük hedef (sayfa)
 * step: kitap detayda "kaç sayfa okudum" buton miktarı (10/20/30 gibi)
 */
type Ctx = {
  goal: number;
  setGoal: (n: number) => void;

  step: number; // ✅ yeni
  setStep: (n: number) => void; // ✅ yeni
};

const KEY = "DAILY_GOAL_V2"; // ✅ versiyon yükselttik (eski KEY ile çakışmasın)
const C = createContext<Ctx | null>(null);

export function ReadingGoalProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  // ✅ default değerler
  const [goal, setGoalState] = useState<number>(20);
  const [step, setStepState] = useState<number>(10);

  const [hydrated, setHydrated] = useState(false);

  /**
   * ✅ İlk açılışta AsyncStorage'tan yükle
   */
  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const raw = await AsyncStorage.getItem(KEY);
        if (!mounted) return;

        if (raw) {
          // Beklenen: { goal: number, step: number }
          const parsed = JSON.parse(raw) as { goal?: number; step?: number };

          const g = Number(parsed?.goal);
          const s = Number(parsed?.step);

          // ✅ güvenli set
          setGoalState(Number.isFinite(g) && g > 0 ? Math.round(g) : 20);
          setStepState(Number.isFinite(s) && s > 0 ? Math.round(s) : 10);
        }
      } catch {
        // storage bozulsa bile uygulama çalışsın
        setGoalState(20);
        setStepState(10);
      } finally {
        if (mounted) setHydrated(true);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  /**
   * ✅ goal/step değişince kaydet
   */
  useEffect(() => {
    if (!hydrated) return;
    AsyncStorage.setItem(KEY, JSON.stringify({ goal, step })).catch(() => {});
  }, [goal, step, hydrated]);

  /**
   * ✅ Public setter'lar
   */
  const setGoal = (n: number) => {
    const v = Number(n);
    if (!Number.isFinite(v) || v <= 0) return;
    setGoalState(Math.round(v));
  };

  const setStep = (n: number) => {
    const v = Number(n);
    if (!Number.isFinite(v) || v <= 0) return;
    setStepState(Math.round(v));
  };

  const value = useMemo<Ctx>(
    () => ({ goal, setGoal, step, setStep }),
    [goal, step],
  );

  return <C.Provider value={value}>{children}</C.Provider>;
}

export function useReadingGoal() {
  const ctx = useContext(C);
  if (!ctx) throw new Error("useReadingGoal provider yok");
  return ctx;
}
