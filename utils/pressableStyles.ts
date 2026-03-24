// utils/pressableStyles.ts

import type { ViewStyle } from "react-native";

/**
 * Pressable callback state tipi
 *
 * React Native Pressable içinde style={({ pressed, hovered }) => ...}
 * şeklinde kullanılan state yapısını temsil eder.
 */
type PressableState = {
  pressed: boolean;
  hovered: boolean;
};

/**
 * Buton varyantları
 *
 * primary   -> ana aksiyon butonları
 * secondary -> standart açık zeminli butonlar
 * danger    -> silme / kritik aksiyonlar
 * ghost     -> arka planı görünmeyen hafif butonlar
 */
type Variant = "primary" | "secondary" | "danger" | "ghost";

/**
 * ReadSphere ortak tasarım renkleri
 *
 * Buradaki helper'lar birçok ekranda tekrar kullanılacağı için
 * renkler merkezi şekilde burada tanımlanıyor.
 */
const COLORS = {
  text: "#2f2a24",
  muted: "#7a7268",

  primary: "#7d5739",
  primaryDark: "#6b4a2f",
  primarySoft: "#f3e2d2",

  card: "#fffdf9",
  graySoft: "#f3efe8",

  border: "#ece7df",

  dangerSoft: "#fff4f4",
  dangerSoftHover: "#ffefef",
  dangerSoftPressed: "#ffe3e3",
  dangerBorder: "#ffd8d8",
};

/**
 * Varyanta göre arka plan rengi hesapla
 */
function getBackgroundColor(
  variant: Variant,
  pressed: boolean,
  hovered: boolean,
) {
  /**
   * Ana kahverengi aksiyon butonu
   */
  if (variant === "primary") {
    if (pressed) return COLORS.primaryDark;
    if (hovered) return "#8a6242";
    return COLORS.primary;
  }

  /**
   * Silme / kritik alanlar
   */
  if (variant === "danger") {
    if (pressed) return COLORS.dangerSoftPressed;
    if (hovered) return COLORS.dangerSoftHover;
    return COLORS.dangerSoft;
  }

  /**
   * Hayalet buton
   */
  if (variant === "ghost") {
    if (pressed) return "#eee7de";
    if (hovered) return "#f7f2ec";
    return "transparent";
  }

  /**
   * Varsayılan secondary
   */
  if (pressed) return "#ece6dc";
  if (hovered) return "#f8f4ee";
  return COLORS.card;
}

/**
 * Varyanta göre border rengi hesapla
 */
function getBorderColor(variant: Variant) {
  if (variant === "primary") return COLORS.primary;
  if (variant === "danger") return COLORS.dangerBorder;
  if (variant === "ghost") return "transparent";
  return COLORS.border;
}

/**
 * Varyanta göre text/icon rengi hesapla
 */
export function getPressableTextColor(variant: Variant = "secondary") {
  if (variant === "primary") return "#fff7f4";
  if (variant === "danger") return "#a22b2b";
  return COLORS.text;
}

/**
 * Standart buton stili
 *
 * Kullanım:
 * style={buttonStyle("primary")}
 * style={buttonStyle("secondary", { marginTop: 8 })}
 */
export function buttonStyle(variant: Variant = "secondary", extra?: ViewStyle) {
  return ({ pressed, hovered }: PressableState): ViewStyle => ({
    backgroundColor: getBackgroundColor(variant, pressed, hovered),
    borderWidth: 1,
    borderColor: getBorderColor(variant),

    paddingVertical: 12,
    paddingHorizontal: 14,

    borderRadius: 16,

    alignItems: "center",
    justifyContent: "center",

    /**
     * Hafif basılma efekti
     */
    transform: [{ scale: pressed ? 0.985 : 1 }],

    ...extra,
  });
}

/**
 * Küçük pill / chip tarzı butonlar için
 *
 * Kullanım:
 * style={pillButtonStyle("secondary")}
 * style={pillButtonStyle("primary", { alignSelf: "flex-start" })}
 */
export function pillButtonStyle(
  variant: Variant = "secondary",
  extra?: ViewStyle,
) {
  return ({ pressed, hovered }: PressableState): ViewStyle => ({
    backgroundColor: getBackgroundColor(variant, pressed, hovered),
    borderWidth: 1,
    borderColor: getBorderColor(variant),

    paddingVertical: 8,
    paddingHorizontal: 12,

    borderRadius: 999,

    alignItems: "center",
    justifyContent: "center",

    /**
     * Küçük butonlarda da hafif scale efekti
     */
    transform: [{ scale: pressed ? 0.985 : 1 }],

    ...extra,
  });
}
