// lib/aiDiscovery.ts

const API_BASE =
  process.env.EXPO_PUBLIC_AI_API_URL ||
  "https://readsphere-ai-backend.onrender.com";

export type AIDiscoveryBook = {
  title: string;
  author: string;
  reason?: string;
};

type DiscoveryResponse = {
  success: boolean;
  books?: AIDiscoveryBook[];
  data?: {
    books?: AIDiscoveryBook[];
    sources?: unknown[];
  };
};

function getBooksFromResponse(data: DiscoveryResponse): AIDiscoveryBook[] {
  if (Array.isArray(data.books)) return data.books;
  if (Array.isArray(data.data?.books)) return data.data.books;
  return [];
}

export async function getAIDiscoveryRecommendations(params: {
  genre?: string;
  readerType?: string;
  mood?: string;
  limit?: number;
}): Promise<AIDiscoveryBook[]> {
  const url = `${API_BASE}/api/discovery/recommend`;

  console.log("AI DISCOVERY URL:", url);

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      genre: params.genre,
      readerType: params.readerType,
      mood: params.mood,
      limit: params.limit ?? 10,
    }),
  });

  if (!response.ok) {
    throw new Error("AI discovery isteği başarısız.");
  }

  const data = (await response.json()) as DiscoveryResponse;

  console.log("AI DISCOVERY RESPONSE:", data);

  if (!data.success) return [];

  return getBooksFromResponse(data);
}