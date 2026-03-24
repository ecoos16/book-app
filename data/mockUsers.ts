// data/mockUsers.ts

import type { ChatParticipant } from "../types/chat";

/**
 * ===============================
 * 🔹 AKTİF KULLANICI (CURRENT USER)
 * ===============================
 *
 * Uygulamada giriş yapan kullanıcıyı temsil eder.
 *
 * Not:
 * - Şu an mock (sabit veri)
 * - İleride backend + auth geldiğinde burası dinamik olacak
 */
export const CURRENT_USER: ChatParticipant = {
  id: "u_me",

  /**
   * Kullanıcı adı
   */
  name: "Ecesu",

  /**
   * Avatar:
   * ui-avatars servisi ile dinamik oluşturuluyor
   *
   * Parametreler:
   * - name: isim
   * - background: arka plan rengi
   * - color: yazı rengi
   */
  avatar:
    "https://ui-avatars.com/api/?name=Ecesu&background=111111&color=ffffff",
};

/**
 * ===============================
 * 🔹 MOCK KULLANICILAR
 * ===============================
 *
 * Amaç:
 * - Yeni sohbet başlatma ekranında kullanıcı listesi göstermek
 * - Gerçek backend yokken test edebilmek
 *
 * Not:
 * - İleride backend'den gelecek user listesi ile değiştirilecek
 */
export const MOCK_USERS: ChatParticipant[] = [
  {
    id: "u1",
    name: "Eylül",
    avatar:
      "https://ui-avatars.com/api/?name=Eylul&background=f3e8ff&color=6b21a8",
  },
  {
    id: "u2",
    name: "Mert",
    avatar:
      "https://ui-avatars.com/api/?name=Mert&background=dbeafe&color=1d4ed8",
  },
  {
    id: "u3",
    name: "Zeynep",
    avatar:
      "https://ui-avatars.com/api/?name=Zeynep&background=dcfce7&color=166534",
  },
  {
    id: "u4",
    name: "Deniz",
    avatar:
      "https://ui-avatars.com/api/?name=Deniz&background=fee2e2&color=991b1b",
  },
];
