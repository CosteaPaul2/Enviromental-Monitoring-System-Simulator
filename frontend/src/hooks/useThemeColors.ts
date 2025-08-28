import { useTheme } from "@heroui/use-theme";

export const useThemeColors = () => {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  return {
    isDark,
    theme,
    colors: {
      text: {
        primary: isDark ? "#f4f1f8" : "#11181C",
        secondary: isDark ? "#eae6f0" : "#687076",
        muted: isDark ? "#b8accc" : "#9ca3af",
        inverse: isDark ? "#11181C" : "#f4f1f8",
      },
      background: {
        primary: isDark ? "#0a0a0a" : "#ffffff",
        secondary: isDark ? "#1a1625" : "#f4f4f5",
        tertiary: isDark ? "#2d2838" : "#e4e4e7",
        elevated: isDark ? "#443d5a" : "#ffffff",
      },

      interactive: {
        default: isDark ? "#443d5a" : "#d1d5db",
        hover: isDark ? "#5a4d7a" : "#9ca3af",
        active: isDark ? "#695587" : "#6b7280",
        disabled: isDark ? "#2d2838" : "#e5e7eb",
      },

      form: {
        input: {
          background: isDark ? "#2d2838" : "#ffffff",
          border: isDark ? "#443d5a" : "#d1d5db",
          borderFocus: isDark ? "#801a86" : "#2563eb",
          text: isDark ? "#f4f1f8" : "#11181C",
          placeholder: isDark ? "#9f8fba" : "#9ca3af",
        },
      },

      status: {
        success: isDark ? "#697a21" : "#22c55e",
        warning: isDark ? "#b8b42d" : "#f59e0b",
        danger: isDark ? "#d64edd" : "#ef4444",
        info: isDark ? "#801a86" : "#3b82f6",
      },
    },

    getTextColor: (background?: "light" | "dark") => {
      if (background === "light") return "#11181C";
      if (background === "dark") return "#f4f1f8";

      return isDark ? "#f4f1f8" : "#11181C";
    },

    getContrastColor: (color: string) => {
      const hex = color.replace("#", "");
      const r = parseInt(hex.substr(0, 2), 16);
      const g = parseInt(hex.substr(2, 2), 16);
      const b = parseInt(hex.substr(4, 2), 16);
      const brightness = (r * 299 + g * 587 + b * 114) / 1000;

      return brightness > 128 ? "#11181C" : "#f4f1f8";
    },
  };
};
