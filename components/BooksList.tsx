// components/BooksList.tsx
import { router } from "expo-router";
import React from "react";
import { Pressable, Text, View } from "react-native";
import type { Book } from "../types/book";

export function BooksList({ books }: { books: Book[] }) {
  if (books.length === 0) {
    return (
      <Text style={{ marginTop: 16, color: "#666" }}>
        Henüz burada kitap yok.
      </Text>
    );
  }

  return (
    <View style={{ gap: 10, marginTop: 12 }}>
      {books.map((b) => (
        <Pressable
          key={b.id}
          onPress={() =>
            router.push({
              pathname: "/book/[id]",
              params: { id: b.id },
            })
          }
          style={{
            borderWidth: 1,
            borderColor: "#eee",
            borderRadius: 14,
            padding: 12,
            backgroundColor: "#fff",
          }}
        >
          <Text style={{ fontSize: 16, fontWeight: "700" }}>{b.title}</Text>
          <Text style={{ color: "#666", marginTop: 4 }}>{b.author}</Text>
        </Pressable>
      ))}
    </View>
  );
}
