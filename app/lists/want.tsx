import { router } from "expo-router";
import React from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
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
    <ScrollView contentContainerStyle={{ padding: 16, gap: 14 }}>
      <Text style={{ fontSize: 22, fontWeight: "900" }}>İstiyorum</Text>
      <Text style={{ color: "#666" }}>
        Sonra okumak istediğin kitapları burada tutabilirsin.
      </Text>

      <Pressable
        onPress={() =>
          router.push({
            pathname: "/add-book",
            params: { status: "want" },
          })
        }
        style={{
          backgroundColor: "#111",
          paddingVertical: 12,
          borderRadius: 12,
          alignItems: "center",
        }}
      >
        <Text style={{ color: "#fff", fontWeight: "900" }}>
          + İstiyorum listesine kitap ekle
        </Text>
      </Pressable>

      {books.length === 0 ? (
        <View
          style={{
            padding: 16,
            borderRadius: 14,
            borderWidth: 1,
            borderColor: "#eee",
            backgroundColor: "#fff",
          }}
        >
          <Text style={{ fontWeight: "800", marginBottom: 6 }}>
            Henüz bu listede kitap yok
          </Text>
          <Text style={{ color: "#666" }}>
            Okumayı planladığın kitapları bu listeye ekleyebilirsin.
          </Text>
        </View>
      ) : (
        <BooksList books={books} />
      )}
    </ScrollView>
  );
}
