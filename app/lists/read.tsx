import React from "react";
import { ScrollView, Text } from "react-native";
import { BooksList } from "../../components/BooksList";
import { useBooks } from "../../context/BooksContext";

export default function ReadList() {
  const { getByStatus, isHydrated } = useBooks();
  const books = getByStatus("read");

  if (!isHydrated) {
    return (
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Text>Yükleniyor…</Text>
      </ScrollView>
    );
  }

  return (
    <ScrollView contentContainerStyle={{ padding: 16 }}>
      <Text style={{ fontSize: 22, fontWeight: "700" }}>Okudum</Text>
      <BooksList books={books} />
    </ScrollView>
  );
}
