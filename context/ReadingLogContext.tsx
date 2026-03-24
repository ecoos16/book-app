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
 * Dışarı export ettiğimiz log tipi
 *
 * date  -> YYYY-MM-DD formatında tutulur
 * pages -> o gün okunan toplam sayfa
 */
export type ReadingLogItem = {
  date: string;
  pages: number;
};

/**
 * Context dışına açılacak yapı
 */
type ReadingLogContextValue = {
  logs: ReadingLogItem[];

  /**
   * Yeni okuma kaydı ekle
   * date verilmezse bugünün tarihine ekler
   */
  addLog: (pages: number, date?: string) => void;

  /**
   * Liste index'i ile log sil
   */
  removeLog: (index: number) => void;

  /**
   * Tüm logları temizle
   */
  clearLogs: () => void;
};

/**
 * AsyncStorage key
 */
const KEY = "READING_LOG_V1";

/**
 * Context oluştur
 */
const C = createContext<ReadingLogContextValue | null>(null);

/**
 * Bugünün anahtarını üret
 *
 * Format: YYYY-MM-DD
 */
function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

export function ReadingLogProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  /**
   * Tüm loglar
   */
  const [logs, setLogs] = useState<ReadingLogItem[]>([]);

  /**
   * İlk storage yüklemesi tamamlandı mı?
   */
  const [hydrated, setHydrated] = useState(false);

  /**
   * İlk açılışta AsyncStorage'dan logları oku
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
        /**
         * Hata olursa boş liste ile devam et
         */
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
   * Loglar değiştikçe storage'a kaydet
   *
   * hydrated olmadan yazmıyoruz çünkü ilk yükleme bitmeden
   * boş diziyle storage üzerine yazmak istemeyiz
   */
  useEffect(() => {
    if (!hydrated) return;

    AsyncStorage.setItem(KEY, JSON.stringify(logs)).catch(() => {
      // sessiz geç
    });
  }, [logs, hydrated]);

  /**
   * Yeni log ekle
   *
   * Aynı tarih varsa yeni kayıt açmak yerine birleştiriyoruz.
   * Bu profile ekranındaki haftalık toplam için daha mantıklı.
   */
  const addLog: ReadingLogContextValue["addLog"] = (pages, date) => {
    const p = Number(pages) || 0;
    if (p <= 0) return;

    const key = date ?? todayKey();

    setLogs((prev) => {
      const copy = [...prev];
      const idx = copy.findIndex((x) => x.date === key);

      /**
       * Aynı gün varsa pages değerini topla
       */
      if (idx >= 0) {
        copy[idx] = {
          ...copy[idx],
          pages: copy[idx].pages + p,
        };
        return copy;
      }

      /**
       * Aynı gün yoksa yeni kayıt ekle
       */
      return [...copy, { date: key, pages: p }];
    });
  };

  /**
   * Tek log sil
   *
   * Not:
   * Bu yöntem index bazlı çalışıyor.
   * UI tarafında gösterilen sırayla uyumlu olmalı.
   */
  const removeLog: ReadingLogContextValue["removeLog"] = (index) => {
    setLogs((prev) => prev.filter((_, i) => i !== index));
  };

  /**
   * Tüm logları sıfırla
   */
  const clearLogs: ReadingLogContextValue["clearLogs"] = async () => {
    setLogs([]);

    try {
      await AsyncStorage.removeItem(KEY);
    } catch {
      // sessiz geç
    }
  };

  /**
   * Context value
   */
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

/**
 * Context hook
 */
export function useReadingLog() {
  const ctx = useContext(C);

  if (!ctx) {
    throw new Error("useReadingLog must be used within ReadingLogProvider");
  }

  return ctx;
}
