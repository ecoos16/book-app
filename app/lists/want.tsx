import React from "react";
import { ScrollView, Text } from "react-native";
import { BooksList } from "../../components/BooksList";
import { useBooks } from "../../context/BooksContext";

export default function WantList() {
  const { getByStatus, isHydrated } = useBooks();
  const books = getByStatus("want");

  if (!isHydrated) {
    return (
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Text>Yükleniyor…</Text>
      </ScrollView>
    );
  }

  return (
    <ScrollView contentContainerStyle={{ padding: 16 }}>
      <Text style={{ fontSize: 22, fontWeight: "700" }}>İstiyorum</Text>
      <BooksList books={books} />
    </ScrollView>
  );
}
