import type { ViewStyle } from "react-native";

type PressableState = {
  pressed: boolean;
  hovered: boolean;
};

type Variant = "primary" | "secondary" | "danger" | "ghost";

function getBackgroundColor(
  variant: Variant,
  pressed: boolean,
  hovered: boolean,
) {
  if (variant === "primary") {
    if (pressed) return "#333";
    if (hovered) return "#222";
    return "#111";
  }

  if (variant === "danger") {
    if (pressed) return "#ffdede";
    if (hovered) return "#fff3f3";
    return "#fff";
  }

  if (variant === "ghost") {
    if (pressed) return "#f1f1f1";
    if (hovered) return "#fafafa";
    return "transparent";
  }

  if (pressed) return "#f1f1f1";
  if (hovered) return "#fafafa";
  return "#fff";
}

function getBorderColor(variant: Variant) {
  if (variant === "danger") return "#ffd6d6";
  if (variant === "ghost") return "transparent";
  return "#ddd";
}

/**
 * Standart buton stili
 */
export function buttonStyle(variant: Variant = "secondary", extra?: ViewStyle) {
  return ({ pressed, hovered }: PressableState): ViewStyle => ({
    backgroundColor: getBackgroundColor(variant, pressed, hovered),
    borderWidth: variant === "primary" ? 0 : 1,
    borderColor: getBorderColor(variant),
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    transform: [{ scale: pressed ? 0.98 : 1 }],
    ...extra,
  });
}

/**
 * Küçük pill/chip tarzı butonlar için
 */
export function pillButtonStyle(
  variant: Variant = "secondary",
  extra?: ViewStyle,
) {
  return ({ pressed, hovered }: PressableState): ViewStyle => ({
    backgroundColor: getBackgroundColor(variant, pressed, hovered),
    borderWidth: variant === "primary" ? 0 : 1,
    borderColor: getBorderColor(variant),
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    transform: [{ scale: pressed ? 0.98 : 1 }],
    ...extra,
  });
}
