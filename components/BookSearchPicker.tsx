// components/BookSearchPicker.tsx

import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";

import { useAuth } from "../context/AuthContext";
import { searchGoogleBooks } from "../lib/googleBooks";
import { supabase } from "../lib/supabase";
import type { GoogleBook } from "../types/googleBooks";

const COLORS = {
  bg: "#fbf9f5",
  card: "#fffdf9",
  border: "#ece7df",
  text: "#2f2a24",
  muted: "#7a7268",
  primary: "#7d5739",
  primarySoft: "#f3e2d2",
  graySoft: "#f3efe8",
  whiteSoft: "#fff7f4",
  errorSoft: "#fff4f4",
  errorBorder: "#ffd8d8",
  errorText: "#a22b2b",
};

type Props = {
  onSelect: (item: GoogleBook) => void;
  initialQuery?: string;
};

type ProfileSearchRow = {
  id: string;
  username: string | null;
  full_name: string | null;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
};

type StateMessage = {
  title: string;
  description: string;
  variant: "empty" | "error";
};

function getDisplayName(user: ProfileSearchRow) {
  return (
    user.full_name?.trim() ||
    `${user.first_name ?? ""} ${user.last_name ?? ""}`.trim() ||
    user.username ||
    "Kullanıcı"
  );
}

function getInitials(name?: string) {
  if (!name?.trim()) return "U";
  const parts = name.trim().split(" ").filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
}

function UserResultCard({
  user,
  isMe,
  onPress,
}: {
  user: ProfileSearchRow;
  isMe: boolean;
  onPress: () => void;
}) {
  const displayName = getDisplayName(user);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        padding: 12,
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 18,
        backgroundColor: pressed ? "#f5efe7" : COLORS.graySoft,
      })}
    >
      {user.avatar_url ? (
        <Image
          source={{ uri: user.avatar_url }}
          style={{ width: 46, height: 46, borderRadius: 23 }}
          resizeMode="cover"
        />
      ) : (
        <View
          style={{
            width: 46,
            height: 46,
            borderRadius: 23,
            backgroundColor: COLORS.primarySoft,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text style={{ color: COLORS.primary, fontWeight: "900" }}>
            {getInitials(displayName)}
          </Text>
        </View>
      )}

      <View style={{ flex: 1 }}>
        <Text
          numberOfLines={1}
          style={{ color: COLORS.text, fontWeight: "900", fontSize: 15 }}
        >
          {displayName}
        </Text>

        <Text numberOfLines={1} style={{ color: COLORS.muted, fontSize: 13 }}>
          {user.username ? `@${user.username}` : isMe ? "Sen" : "Okur"}
        </Text>
      </View>

      <Ionicons name="chevron-forward" size={18} color={COLORS.muted} />
    </Pressable>
  );
}

function BookCover({ thumbnail }: { thumbnail?: string }) {
  if (thumbnail) {
    return (
      <Image
        source={{ uri: thumbnail }}
        style={{ width: 56, height: 82, borderRadius: 10 }}
        resizeMode="cover"
      />
    );
  }

  return (
    <View
      style={{
        width: 56,
        height: 82,
        borderRadius: 10,
        backgroundColor: COLORS.primarySoft,
        alignItems: "center",
        justifyContent: "center",
        gap: 3,
      }}
    >
      <Ionicons name="book-outline" size={24} color={COLORS.primary} />
      <Text style={{ fontSize: 10, color: COLORS.muted }}>Kapak yok</Text>
    </View>
  );
}

function SearchResultCard({
  item,
  onPress,
}: {
  item: GoogleBook;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: "row",
        gap: 12,
        padding: 12,
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 18,
        backgroundColor: pressed ? "#f5efe7" : COLORS.card,
        alignItems: "center",
      })}
    >
      <BookCover thumbnail={item.thumbnail} />

      <View style={{ flex: 1 }}>
        <Text
          style={{
            fontSize: 15,
            fontWeight: "900",
            flex: 1,
            color: COLORS.text,
          }}
          numberOfLines={2}
        >
          {item.title || "Başlıksız"}
        </Text>

        <Text
          style={{ color: COLORS.muted, marginTop: 4, fontSize: 13 }}
          numberOfLines={1}
        >
          {item.authors?.join(", ") || "Yazar bilinmiyor"}
        </Text>

        <Text style={{ color: COLORS.muted, marginTop: 4, fontSize: 12 }}>
          {item.pageCount ? `${item.pageCount} sayfa` : "Sayfa bilgisi yok"}
        </Text>
      </View>
    </Pressable>
  );
}

function SearchStateBox({ message }: { message: StateMessage }) {
  const isEmpty = message.variant === "empty";

  return (
    <View
      style={{
        borderWidth: 1,
        borderColor: isEmpty ? COLORS.border : COLORS.errorBorder,
        borderRadius: 18,
        paddingVertical: 22,
        paddingHorizontal: 16,
        backgroundColor: isEmpty ? COLORS.card : COLORS.errorSoft,
        alignItems: "center",
        gap: 8,
      }}
    >
      <Ionicons
        name={isEmpty ? "search-outline" : "alert-circle-outline"}
        size={24}
        color={COLORS.primary}
      />

      <Text
        style={{
          fontWeight: "900",
          color: isEmpty ? COLORS.text : COLORS.errorText,
        }}
      >
        {message.title}
      </Text>

      <Text
        style={{
          color: isEmpty ? COLORS.muted : COLORS.errorText,
          textAlign: "center",
        }}
      >
        {message.description}
      </Text>
    </View>
  );
}

export default function BookSearchPicker({ onSelect, initialQuery }: Props) {
  const { user: authUser } = useAuth();

  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [bookResults, setBookResults] = useState<GoogleBook[]>([]);
  const [userResults, setUserResults] = useState<ProfileSearchRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<StateMessage | null>(null);
  useEffect(() => {
    if (initialQuery && initialQuery.trim()) {
      setQuery(initialQuery);
    }
  }, [initialQuery]);

  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query.trim());
    }, 400);

    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    const q = debouncedQuery.trim();

    if (q.length < 2) {
      setBookResults([]);
      setUserResults([]);
      setMessage(null);
      setLoading(false);
      abortRef.current?.abort();
      return;
    }

    const runSearch = async () => {
      abortRef.current?.abort();

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        setLoading(true);
        setMessage(null);

        const [booksData, usersResponse] = await Promise.all([
          searchGoogleBooks(q, 10, controller.signal),
          supabase
            .from("profiles")
            .select(
              "id, username, full_name, first_name, last_name, avatar_url",
            )
            .or(
              `username.ilike.%${q}%,full_name.ilike.%${q}%,first_name.ilike.%${q}%,last_name.ilike.%${q}%`,
            )
            .limit(6),
        ]);

        if (controller.signal.aborted) return;

        if (usersResponse.error) {
          console.log("USER SEARCH ERROR:", usersResponse.error);
        }

        const users = (usersResponse.data ?? []) as ProfileSearchRow[];

        setBookResults(booksData);
        setUserResults(users);

        if (booksData.length === 0 && users.length === 0) {
          setMessage({
            title: "Sonuç bulunamadı",
            description: "Farklı bir kitap, yazar veya kullanıcı adı dene.",
            variant: "empty",
          });
        }
      } catch (error: any) {
        if (error?.name === "AbortError") return;

        setBookResults([]);
        setUserResults([]);
        setMessage({
          title: "Arama hatası",
          description:
            typeof error?.message === "string"
              ? error.message
              : "Arama sırasında bir hata oluştu.",
          variant: "error",
        });
      } finally {
        setLoading(false);
      }
    };

    runSearch();
  }, [debouncedQuery]);

  const handleClear = () => {
    abortRef.current?.abort();
    setQuery("");
    setDebouncedQuery("");
    setBookResults([]);
    setUserResults([]);
    setMessage(null);
    setLoading(false);
  };

  const handleSelectBook = (item: GoogleBook) => {
    onSelect(item);
    setBookResults([]);
    setUserResults([]);
    setMessage(null);
  };

  const handleSelectUser = (userId: string) => {
    handleClear();

    if (userId === authUser?.id) {
      router.push("/profile");
      return;
    }

    router.push({
      pathname: "/user/[id]",
      params: { id: userId },
    });
  };

  return (
    <View style={{ gap: 12 }}>
      <View
        style={{
          borderWidth: 1,
          borderColor: COLORS.border,
          borderRadius: 16,
          paddingHorizontal: 14,
          paddingVertical: 12,
          backgroundColor: COLORS.card,
          flexDirection: "row",
          alignItems: "center",
          gap: 10,
        }}
      >
        <Ionicons name="search-outline" size={18} color={COLORS.muted} />

        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Kitap, yazar veya kullanıcı ara"
          placeholderTextColor="#9a9389"
          autoCorrect={false}
          autoCapitalize="none"
          returnKeyType="search"
          style={{
            flex: 1,
            fontSize: 15,
            color: COLORS.text,
          }}
        />

        {!!query.trim() && (
          <Pressable onPress={handleClear}>
            <Ionicons name="close-circle" size={18} color={COLORS.muted} />
          </Pressable>
        )}
      </View>

      {query.trim().length > 0 && query.trim().length < 2 && (
        <Text style={{ color: COLORS.muted, fontSize: 12 }}>
          Aramak için en az 2 karakter yaz.
        </Text>
      )}

      {loading && (
        <View
          style={{
            borderWidth: 1,
            borderColor: COLORS.border,
            borderRadius: 18,
            paddingVertical: 18,
            paddingHorizontal: 14,
            backgroundColor: COLORS.card,
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
          }}
        >
          <ActivityIndicator color={COLORS.primary} />
          <Text style={{ color: COLORS.muted }}>Aranıyor...</Text>
        </View>
      )}

      {!loading && !!message && <SearchStateBox message={message} />}

      {!loading && userResults.length > 0 && (
        <View
          style={{
            gap: 8,
            borderWidth: 1,
            borderColor: COLORS.border,
            borderRadius: 20,
            padding: 10,
            backgroundColor: COLORS.card,
          }}
        >
          <Text
            style={{
              fontWeight: "900",
              color: COLORS.text,
              marginBottom: 4,
              fontSize: 15,
            }}
          >
            Kullanıcılar
          </Text>

          {userResults.map((user) => (
            <UserResultCard
              key={user.id}
              user={user}
              isMe={user.id === authUser?.id}
              onPress={() => handleSelectUser(user.id)}
            />
          ))}
        </View>
      )}

      {!loading && bookResults.length > 0 && (
        <View
          style={{
            gap: 8,
            borderWidth: 1,
            borderColor: COLORS.border,
            borderRadius: 20,
            padding: 10,
            backgroundColor: COLORS.card,
          }}
        >
          <Text
            style={{
              fontWeight: "900",
              color: COLORS.text,
              marginBottom: 4,
              fontSize: 15,
            }}
          >
            Kitaplar
          </Text>

          {bookResults.map((item) => (
            <SearchResultCard
              key={item.id}
              item={item}
              onPress={() => handleSelectBook(item)}
            />
          ))}
        </View>
      )}
    </View>
  );
}
