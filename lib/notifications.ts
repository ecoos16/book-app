// lib/notifications.ts

import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { supabase } from "./supabase";

// 🔥 Notification nasıl davranacak
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
shouldShowBanner: true,
shouldShowList: true,
shouldPlaySound: true,
shouldSetBadge: true,
  }),
});

// 🔥 Push token al + Supabase’e kaydet
export async function registerForPushNotificationsAsync(userId: string) {
  if (!Device.isDevice) {
    console.log("Fiziksel cihaz gerekli (emülatör olmaz)");
    return;
  }

  const { status: existingStatus } =
    await Notifications.getPermissionsAsync();

  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    console.log("Bildirim izni verilmedi");
    return;
  }

  const tokenData = await Notifications.getExpoPushTokenAsync();
  const token = tokenData.data;

  console.log("📱 PUSH TOKEN:", token);

  // 🔥 Supabase’e kaydet
  await supabase
    .from("profiles")
    .update({ expo_push_token: token })
    .eq("id", userId);

  // 🔥 Android için kanal
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#7d5739",
    });
  }
}

// 🔥 Notification gönderme (server yoksa buradan da olur)
export async function sendPushNotification(
  expoPushToken: string,
  title: string,
  body: string,
) {
  const message = {
    to: expoPushToken,
    sound: "default",
    title,
    body,
    data: { someData: "goes here" },
  };

  await fetch("https://exp.host/--/api/v2/push/send", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Accept-encoding": "gzip, deflate",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(message),
  });
}