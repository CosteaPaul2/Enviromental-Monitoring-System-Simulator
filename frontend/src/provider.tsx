import type { NavigateOptions } from "react-router-dom";

import { HeroUIProvider } from "@heroui/system";
import { useHref, useNavigate } from "react-router-dom";
import { useEffect } from "react";

import { AuthProvider } from "@/contexts/AuthContext";
import { AppUpdateProvider } from "@/contexts/AppUpdateContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { HistoricalDataProvider } from "@/contexts/HistoricalDataContext";

// Import global styles
import "@/styles/globals.css";

declare module "@react-types/shared" {
  interface RouterConfig {
    routerOptions: NavigateOptions;
  }
}

const THEME_STORAGE_KEY = "environmental-monitoring-theme";

function ThemeInitializer() {
  useEffect(() => {
    // Initialize theme on app load
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY) || "dark";

    // Apply theme to document immediately
    document.documentElement.classList.remove("light", "dark");
    document.documentElement.classList.add(savedTheme);

    // Set data attribute for CSS targeting
    document.documentElement.setAttribute("data-theme", savedTheme);
  }, []);

  return null;
}

export function Provider({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();

  return (
    <HeroUIProvider navigate={navigate} useHref={useHref}>
      <ThemeInitializer />
      <AuthProvider>
        <NotificationProvider>
          <AppUpdateProvider>
            <HistoricalDataProvider>{children}</HistoricalDataProvider>
          </AppUpdateProvider>
        </NotificationProvider>
      </AuthProvider>
    </HeroUIProvider>
  );
}
