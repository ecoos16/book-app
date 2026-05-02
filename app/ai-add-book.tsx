// app/ai-add-book.tsx

import * as ImageManipulator from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { useAuth } from "../context/AuthContext";
import { useBooks } from "../context/BooksContext";
import { supabase } from "../lib/supabase";
const AI_BACKEND_URL = "http://192.168.1.104:3001/api/ai-books/analyze";

type BookStatus = "want" | "reading" | "read";

const STATUS_LABELS: Record<BookStatus, string> = {
  want: "İstiyorum",
  reading: "Okuyorum",
  read: "Okudum",
};

export default function AiAddBookScreen() {
  const { user } = useAuth();
  const { addBook, books } = useBooks();

  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [image, setImage] = useState<ImagePicker.ImagePickerAsset | null>(null);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [bookData, setBookData] = useState<any>(null);
  const [coverGuess, setCoverGuess] = useState<any>(null);

  const [notice, setNotice] = useState("");
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  const [savedDbBookId, setSavedDbBookId] = useState<string | null>(null);

  const showNotice = (message: string) => {
    setNotice(message);

    setTimeout(() => {
      setNotice("");
    }, 2500);
  };
  const prepareImageForAI = async (uri: string) => {
    const manipulated = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: 900 } }],
      {
        compress: 0.85,
        format: ImageManipulator.SaveFormat.JPEG,
      },
    );

    return {
      uri: manipulated.uri,
      name: "cover.jpg",
      type: "image/jpeg",
    };
  };
  const normalizeBookText = (value: unknown) => {
    if (typeof value !== "string") return "";
    return value.trim().toLocaleLowerCase("tr").replace(/\s+/g, " ");
  };

  const isAlreadyInLibrary = () => {
    const nextTitle = normalizeBookText(bookData?.title || title);
    const nextAuthor = normalizeBookText(
      bookData?.author || author || "Yazar bilinmiyor",
    );

    return books.some(
      (book) =>
        normalizeBookText(book.title) === nextTitle &&
        normalizeBookText(book.author) === nextAuthor,
    );
  };

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (permission.status !== "granted") {
      Alert.alert("İzin gerekli", "Galeri izni vermen gerekiyor.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.8,
    });

    if (!result.canceled && result.assets?.length > 0) {
      const fixedImage = await prepareImageForAI(result.assets[0].uri);
      setImage(fixedImage as any);
    }
  };
  const takePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();

    if (permission.status !== "granted") {
      Alert.alert("İzin gerekli", "Kamera izni vermen gerekiyor.");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets?.length > 0) {
      const fixedImage = await prepareImageForAI(result.assets[0].uri);
      setImage(fixedImage as any);
    }
  };
  const analyzeBook = async () => {
    if (!title.trim() && !image) {
      Alert.alert("Eksik bilgi", "Kitap adı yaz veya kapak görseli ekle.");
      return;
    }

    setLoading(true);
    setBookData(null);
    setCoverGuess(null);

    try {
      const formData = new FormData();

      if (title.trim()) formData.append("title", title.trim());
      if (author.trim()) formData.append("author", author.trim());

      if (image) {
        if (Platform.OS === "web") {
          const imageResponse = await fetch(image.uri);
          const blob = await imageResponse.blob();
          formData.append("cover", blob, "cover.jpg");
        } else {
          formData.append("cover", {
            uri: image.uri,
            name: "cover.jpg",
            type: "image/jpeg",
          } as any);
        }
      }

      const response = await fetch(AI_BACKEND_URL, {
        method: "POST",
        body: formData,
      });

      const json = await response.json();

      console.log("AI RESPONSE:", json);

      if (!json.success) {
        Alert.alert("Hata", json.message || "AI analiz başarısız.");
        return;
      }

      setBookData(json.data);
      setCoverGuess(json.coverGuess);
    } catch (error) {
      console.log("AI ADD BOOK ERROR:", error);
      Alert.alert("Hata", "Backend bağlantısı kurulamadı.");
    } finally {
      setLoading(false);
    }
  };

  const openSaveConfirm = () => {
    if (!bookData) return;
    setConfirmModalVisible(true);
  };

  const saveToDatabase = async () => {
    if (!bookData || !user?.id) {
      Alert.alert("Hata", "Kullanıcı bilgisi veya kitap verisi bulunamadı.");
      return;
    }

    try {
      setSaving(true);

      const nextTitle = bookData.title || title;
      const nextAuthor = bookData.author || author || "Yazar bilinmiyor";

      const { data: existingBook, error: existingError } = await supabase
        .from("books")
        .select("id")
        .eq("user_id", user.id)
        .ilike("title", nextTitle)
        .ilike("author", nextAuthor)
        .maybeSingle();

      if (existingError) {
        console.log("SUPABASE EXISTING BOOK CHECK ERROR:", existingError);
      }

      if (existingBook?.id) {
        setSavedDbBookId(existingBook.id);
        setConfirmModalVisible(false);
        setCategoryModalVisible(true);
        showNotice(`${nextTitle} veritabanında zaten kayıtlı.`);
        return;
      }

      const { data, error } = await supabase
        .from("books")
        .insert({
          user_id: user.id,
          title: nextTitle,
          author: nextAuthor,
          thumbnail: bookData.cover_url || "",
          status: "want",
          pages_read: 0,
          page_count: Number(bookData.page_count || 0),
          rating: null,
          publisher: bookData.publisher || "",
          description: bookData.description || "",
          published_year: Number(bookData.published_year || 0),
          language: bookData.language || "",
          categories: bookData.categories || [],
          isbn: bookData.isbn || "",
          source_type: "ai_agent",
          ai_confidence: Number(bookData.confidence || 0),
          ai_sources: bookData.sources || [],
        })
        .select("id")
        .single();

      if (error) {
        console.log("SUPABASE BOOK INSERT ERROR:", error);
        Alert.alert("Hata", error.message);
        return;
      }

      setSavedDbBookId(data?.id ?? null);
      setConfirmModalVisible(false);
      setCategoryModalVisible(true);
      showNotice(`${bookData.title || title} veritabanına kaydedildi.`);
    } catch (error: any) {
      console.log("SAVE AI BOOK DB ERROR:", error);
      Alert.alert("Hata", error?.message || "Kayıt sırasında hata oluştu.");
    } finally {
      setSaving(false);
    }
  };

  const addToLocalLibrary = async (status: BookStatus) => {
    if (!bookData) return;

    const nextTitle = bookData.title || title;
    const nextAuthor = bookData.author || author || "Yazar bilinmiyor";

    if (isAlreadyInLibrary()) {
      setCategoryModalVisible(false);
      showNotice(`${nextTitle} zaten kitaplığında var. Tekrar eklenmedi.`);
      return;
    }

    const result = addBook({
      title: nextTitle,
      author: nextAuthor,
      status,
      pagesTotal: Number(bookData.page_count || 0),
      pagesRead: 0,
      rating: 0,
      note: bookData.description || "",
      thumbnail: bookData.cover_url || "",
      googleId: "",
    });

    if (!result.created) {
      setCategoryModalVisible(false);
      showNotice(`${nextTitle} zaten kitaplığında var. Tekrar eklenmedi.`);
      return;
    }

    if (savedDbBookId) {
      await supabase.from("books").update({ status }).eq("id", savedDbBookId);
    }

    setCategoryModalVisible(false);
    showNotice(
      `${bookData.title || title} kitabı ${STATUS_LABELS[status]} kitaplığına eklendi.`,
    );

    setTimeout(() => {
      router.push("/(tabs)/library");
    }, 1800);
  };

  const skipLocalLibrary = () => {
    setCategoryModalVisible(false);
    showNotice(`${bookData?.title || title} kitaplığa eklenmedi.`);
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#fbf9f5" }}>
      {!!notice && (
        <View
          pointerEvents="none"
          style={{
            position: "absolute",
            top: 18,
            left: 16,
            right: 16,
            zIndex: 9999,
            elevation: 9999,
            backgroundColor: "#2f2a24",
            paddingVertical: 13,
            paddingHorizontal: 14,
            borderRadius: 16,
            shadowColor: "#000",
            shadowOpacity: 0.18,
            shadowRadius: 12,
            shadowOffset: { width: 0, height: 6 },
          }}
        >
          <Text
            style={{
              color: "#fff7f4",
              textAlign: "center",
              fontWeight: "900",
            }}
          >
            {notice}
          </Text>
        </View>
      )}

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 20, paddingBottom: 60 }}
      >
        <Text style={{ fontSize: 26, fontWeight: "800", color: "#2f2a24" }}>
          AI ile Kitap Ekle
        </Text>

        <Text style={{ marginTop: 8, color: "#7a7268", fontSize: 14 }}>
          Kitap adını yazabilir, kapak görseli yükleyebilir ya da kamerayla
          çekebilirsin.
        </Text>

        <View
          style={{
            marginTop: 24,
            backgroundColor: "#fffdf9",
            borderRadius: 18,
            padding: 16,
            borderWidth: 1,
            borderColor: "#ece7df",
          }}
        >
          <Text style={{ fontWeight: "700", color: "#2f2a24" }}>Kitap Adı</Text>

          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="Örn: Sefiller"
            style={{
              marginTop: 8,
              borderWidth: 1,
              borderColor: "#e5ded4",
              borderRadius: 14,
              padding: 12,
              backgroundColor: "#fff",
            }}
          />

          <View
            style={{
              marginTop: 14,
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
            }}
          >
            <Text style={{ fontWeight: "700", color: "#2f2a24" }}>
              Yazar Adı
            </Text>

            <View
              style={{
                paddingHorizontal: 8,
                paddingVertical: 3,
                borderRadius: 999,
                backgroundColor: "#f3efe8",
                borderWidth: 1,
                borderColor: "#ece7df",
              }}
            >
              <Text
                style={{ fontSize: 11, color: "#7a7268", fontWeight: "700" }}
              >
                Opsiyonel
              </Text>
            </View>
          </View>

          <TextInput
            value={author}
            onChangeText={setAuthor}
            placeholder="Örn: Victor Hugo"
            style={{
              marginTop: 8,
              borderWidth: 1,
              borderColor: "#e5ded4",
              borderRadius: 14,
              padding: 12,
              backgroundColor: "#fff",
            }}
          />

          <View style={{ flexDirection: "row", gap: 10, marginTop: 16 }}>
            <Pressable
              onPress={pickImage}
              style={{
                flex: 1,
                paddingVertical: 14,
                borderRadius: 16,
                backgroundColor: "#f3efe8",
                borderWidth: 1,
                borderColor: "#ece7df",
                alignItems: "center",
              }}
            >
              <Text style={{ fontWeight: "800", color: "#2f2a24" }}>
                🖼️ Galeriden Seç
              </Text>
            </Pressable>

            <Pressable
              onPress={takePhoto}
              style={{
                flex: 1,
                paddingVertical: 14,
                borderRadius: 16,
                backgroundColor: "#f3efe8",
                borderWidth: 1,
                borderColor: "#ece7df",
                alignItems: "center",
              }}
            >
              <Text style={{ fontWeight: "800", color: "#2f2a24" }}>
                📷 Kamera
              </Text>
            </Pressable>
          </View>

          {image && (
            <Image
              source={{ uri: image.uri }}
              style={{
                width: 110,
                height: 160,
                borderRadius: 14,
                marginTop: 16,
                alignSelf: "center",
              }}
              resizeMode="cover"
            />
          )}

          <Pressable
            onPress={analyzeBook}
            disabled={loading}
            style={{
              marginTop: 18,
              backgroundColor: loading ? "#b8a99b" : "#7d5739",
              padding: 14,
              borderRadius: 14,
            }}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text
                style={{
                  color: "#fff",
                  textAlign: "center",
                  fontWeight: "700",
                }}
              >
                AI ile Bilgileri Bul
              </Text>
            )}
          </Pressable>
        </View>

        {bookData && (
          <View
            style={{
              marginTop: 24,
              backgroundColor: "#fffdf9",
              borderRadius: 18,
              padding: 16,
              borderWidth: 1,
              borderColor: "#ece7df",
            }}
          >
            <Text style={{ fontSize: 20, fontWeight: "800", color: "#2f2a24" }}>
              Bulunan Bilgiler
            </Text>

            {bookData.cover_url ? (
              <Image
                source={{ uri: bookData.cover_url }}
                style={{
                  width: 120,
                  height: 180,
                  borderRadius: 14,
                  marginTop: 14,
                  alignSelf: "center",
                  backgroundColor: "#f3efe8",
                }}
                resizeMode="cover"
              />
            ) : null}

            <Text style={{ marginTop: 12 }}>Başlık: {bookData.title}</Text>
            <Text>Yazar: {bookData.author}</Text>
            <Text>Yayınevi: {bookData.publisher}</Text>
            <Text>Sayfa: {bookData.page_count}</Text>
            <Text>Yıl: {bookData.published_year}</Text>
            <Text>Dil: {bookData.language}</Text>
            <Text>ISBN: {bookData.isbn}</Text>
            <Text>Güven: %{Math.round((bookData.confidence || 0) * 100)}</Text>

            <Text style={{ marginTop: 12, fontWeight: "700" }}>
              Kitap Özeti:
            </Text>

            <Text style={{ marginTop: 4, color: "#5f574f", lineHeight: 21 }}>
              {bookData.description}
            </Text>

            <Pressable
              onPress={openSaveConfirm}
              disabled={saving}
              style={{
                marginTop: 18,
                backgroundColor: saving ? "#b8a99b" : "#7d5739",
                padding: 14,
                borderRadius: 14,
              }}
            >
              {saving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text
                  style={{
                    color: "#fff",
                    textAlign: "center",
                    fontWeight: "800",
                  }}
                >
                  Kaydet
                </Text>
              )}
            </Pressable>
          </View>
        )}
      </ScrollView>

      <Modal transparent visible={confirmModalVisible} animationType="fade">
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.35)",
            alignItems: "center",
            justifyContent: "center",
            padding: 24,
          }}
        >
          <View
            style={{
              width: "100%",
              maxWidth: 420,
              backgroundColor: "#fffdf9",
              borderRadius: 24,
              padding: 20,
              borderWidth: 1,
              borderColor: "#ece7df",
            }}
          >
            <Text style={{ fontSize: 20, fontWeight: "900", color: "#2f2a24" }}>
              Bilgileri kontrol ettin mi?
            </Text>

            <Text style={{ marginTop: 8, color: "#7a7268", lineHeight: 21 }}>
              AI tarafından bulunan kitap bilgilerini kontrol ettiysen
              veritabanına kaydedebilirsin.
            </Text>

            <View style={{ flexDirection: "row", gap: 10, marginTop: 18 }}>
              <Pressable
                onPress={() => setConfirmModalVisible(false)}
                style={{
                  flex: 1,
                  padding: 13,
                  borderRadius: 14,
                  backgroundColor: "#f3efe8",
                }}
              >
                <Text style={{ textAlign: "center", fontWeight: "800" }}>
                  Vazgeç
                </Text>
              </Pressable>

              <Pressable
                onPress={saveToDatabase}
                style={{
                  flex: 1,
                  padding: 13,
                  borderRadius: 14,
                  backgroundColor: "#7d5739",
                }}
              >
                <Text
                  style={{
                    textAlign: "center",
                    color: "#fff",
                    fontWeight: "800",
                  }}
                >
                  Eminim, Kaydet
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal transparent visible={categoryModalVisible} animationType="fade">
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.35)",
            alignItems: "center",
            justifyContent: "center",
            padding: 24,
          }}
        >
          <View
            style={{
              width: "100%",
              maxWidth: 420,
              backgroundColor: "#fffdf9",
              borderRadius: 24,
              padding: 20,
              borderWidth: 1,
              borderColor: "#ece7df",
            }}
          >
            <Text style={{ fontSize: 20, fontWeight: "900", color: "#2f2a24" }}>
              Kitaplığa eklemek ister misin?
            </Text>

            <Text style={{ marginTop: 8, color: "#7a7268", lineHeight: 21 }}>
              Kitabı hangi kategoriye eklemek istersin?
            </Text>

            {(["want", "reading", "read"] as BookStatus[]).map((status) => (
              <Pressable
                key={status}
                onPress={() => addToLocalLibrary(status)}
                style={{
                  marginTop: 10,
                  padding: 13,
                  borderRadius: 14,
                  backgroundColor: "#7d5739",
                }}
              >
                <Text
                  style={{
                    textAlign: "center",
                    color: "#fff",
                    fontWeight: "800",
                  }}
                >
                  {STATUS_LABELS[status]}
                </Text>
              </Pressable>
            ))}

            <Pressable
              onPress={skipLocalLibrary}
              style={{
                marginTop: 10,
                padding: 13,
                borderRadius: 14,
                backgroundColor: "#f3efe8",
              }}
            >
              <Text style={{ textAlign: "center", fontWeight: "800" }}>
                İstemiyorum
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}
