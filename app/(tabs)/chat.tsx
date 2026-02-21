import React from "react";
import { FlatList, Pressable, Text, View } from "react-native";

type ChatItem = {
  id: string;
  title: string; // kitap adı veya sohbet başlığı
  lastMessage: string;
  time: string;
  unread?: number;
  members: string;
};

const DEMO_CHATS: ChatItem[] = [
  {
    id: "c1",
    title: "Kürk Mantolu Madonna",
    lastMessage: "O tablo sahnesi… çok ağırdı ya 😭",
    time: "21:14",
    unread: 2,
    members: "3 kişi",
  },
  {
    id: "c2",
    title: "1984",
    lastMessage: "Big Brother kısmına geldin mi?",
    time: "20:02",
    unread: 0,
    members: "5 kişi",
  },
  {
    id: "c3",
    title: "Hayvan Çiftliği",
    lastMessage: "Bence en iyisi final bölümü.",
    time: "Dün",
    unread: 5,
    members: "2 kişi",
  },
  {
    id: "c4",
    title: "Simyacı",
    lastMessage: "Alt metinleri çok güzel yakalamışsın.",
    time: "Pzt",
    unread: 0,
    members: "4 kişi",
  },
];

export default function Chat() {
  return (
    <View style={{ flex: 1, padding: 16, gap: 12 }}>
      <Text style={{ fontSize: 22, fontWeight: "800" }}>Sohbet</Text>

      <FlatList
        data={DEMO_CHATS}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 16 }}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => {}}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 12,
              padding: 14,
              borderRadius: 14,
              backgroundColor: "#f4f4f4",
              borderWidth: 1,
              borderColor: "#e9e9e9",
            }}
          >
            {/* Avatar */}
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                backgroundColor: "#ddd",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={{ fontWeight: "800" }}>
                {item.title.slice(0, 1)}
              </Text>
            </View>

            {/* Texts */}
            <View style={{ flex: 1 }}>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                <Text
                  style={{ fontSize: 16, fontWeight: "800" }}
                  numberOfLines={1}
                >
                  {item.title}
                </Text>
                <Text style={{ color: "#666", fontSize: 12 }}>{item.time}</Text>
              </View>

              <Text style={{ color: "#666", marginTop: 4 }} numberOfLines={1}>
                {item.lastMessage}
              </Text>

              <View
                style={{
                  flexDirection: "row",
                  gap: 10,
                  marginTop: 6,
                  alignItems: "center",
                }}
              >
                <Text style={{ color: "#888", fontSize: 12 }}>
                  {item.members}
                </Text>

                {!!item.unread && item.unread > 0 && (
                  <View
                    style={{
                      marginLeft: "auto",
                      paddingHorizontal: 8,
                      paddingVertical: 4,
                      borderRadius: 999,
                      backgroundColor: "#111",
                    }}
                  >
                    <Text
                      style={{
                        color: "white",
                        fontSize: 12,
                        fontWeight: "700",
                      }}
                    >
                      {item.unread}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </Pressable>
        )}
      />
    </View>
  );
}
