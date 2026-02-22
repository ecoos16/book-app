// context/ReadingLogContext.tsx
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

/**
 * ✅ Dışarı export ettiğimiz type
 * Profile.tsx bunu import edebilecek
 */
export type ReadingLogItem = {
  date: string; // "YYYY-MM-DD"
  pages: number;
};

type ReadingLogContextValue = {
  logs: ReadingLogItem[];
  addLog: (pages: number, date?: string) => void; // ✅ date opsiyonel
  removeLog: (index: number) => void;
  clearLogs: () => void;
};

const KEY = "READING_LOG_V1";
const C = createContext<ReadingLogContextValue | null>(null);

/**
 * ✅ Bugün anahtarı
 */
function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

export function ReadingLogProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [logs, setLogs] = useState<ReadingLogItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  /**
   * ✅ İlk açılışta AsyncStorage'dan oku
   */
  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const raw = await AsyncStorage.getItem(KEY);
        if (!mounted) return;

        if (raw) {
          const parsed = JSON.parse(raw) as ReadingLogItem[];
          setLogs(Array.isArray(parsed) ? parsed : []);
        }
      } catch {
        setLogs([]);
      } finally {
        if (mounted) setHydrated(true);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  /**
   * ✅ logs değişince kaydet
   */
  useEffect(() => {
    if (!hydrated) return;
    AsyncStorage.setItem(KEY, JSON.stringify(logs)).catch(() => {});
  }, [logs, hydrated]);

  /**
   * ✅ Sayfa ekle
   * date verilmezse bugüne ekler
   */
  const addLog: ReadingLogContextValue["addLog"] = (pages, date) => {
    const p = Number(pages) || 0;
    if (p <= 0) return;

    const key = date ?? todayKey();

    // aynı güne eklemeleri BİRLEŞTİRELİM (daha mantıklı)
    setLogs((prev) => {
      const copy = [...prev];
      const idx = copy.findIndex((x) => x.date === key);

      if (idx >= 0) {
        copy[idx] = { ...copy[idx], pages: copy[idx].pages + p };
        return copy;
      }

      return [...copy, { date: key, pages: p }];
    });
  };

  /**
   * ✅ Tek log sil (liste index'i ile)
   */
  const removeLog: ReadingLogContextValue["removeLog"] = (index) => {
    setLogs((prev) => prev.filter((_, i) => i !== index));
  };

  /**
   * ✅ Logları sıfırla
   */
  const clearLogs: ReadingLogContextValue["clearLogs"] = async () => {
    setLogs([]);
    try {
      await AsyncStorage.removeItem(KEY);
    } catch {}
  };

  const value = useMemo<ReadingLogContextValue>(
    () => ({
      logs,
      addLog,
      removeLog,
      clearLogs,
    }),
    [logs],
  );

  return <C.Provider value={value}>{children}</C.Provider>;
}

export function useReadingLog() {
  const ctx = useContext(C);
  if (!ctx)
    throw new Error("useReadingLog must be used within ReadingLogProvider");
  return ctx;
}
