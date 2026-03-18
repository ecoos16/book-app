// data/mockUsers.ts

import type { ChatParticipant } from "../types/chat";

/**
 * Uygulamadaki aktif mock kullanıcı
 */
export const CURRENT_USER: ChatParticipant = {
  id: "u_me",
  name: "Ecesu",
  avatar:
    "https://ui-avatars.com/api/?name=Ecesu&background=111111&color=ffffff",
};

/**
 * Yeni sohbet başlatırken gösterilecek diğer mock kullanıcılar
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
