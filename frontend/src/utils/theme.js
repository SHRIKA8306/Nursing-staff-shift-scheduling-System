/**
 * NurseSync Global Theme Utility
 * Handles theme switching, persistence in localStorage, and HTML class/attribute synchronization.
 */

export const THEME_STORAGE_KEY = "nursesync_theme";

export const getSavedTheme = () => {
  try {
    return localStorage.getItem(THEME_STORAGE_KEY) || "Light";
  } catch (e) {
    return "Light";
  }
};

export const isSystemDark = () => {
  if (typeof window !== "undefined" && window.matchMedia) {
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  }
  return false;
};

export const applyTheme = (themeMode) => {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, themeMode);
  } catch (e) {}

  const isDark =
    themeMode === "Dark" || (themeMode === "System" && isSystemDark());

  const root = document.documentElement;
  const body = document.body;

  if (isDark) {
    root.setAttribute("data-theme", "dark");
    root.classList.add("dark-theme");
    if (body) {
      body.classList.add("dark-theme");
      body.setAttribute("data-theme", "dark");
    }
  } else {
    root.setAttribute("data-theme", "light");
    root.classList.remove("dark-theme");
    if (body) {
      body.classList.remove("dark-theme");
      body.setAttribute("data-theme", "light");
    }
  }

  // Dispatch custom event so all open components can sync state
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("nursesync-theme-changed", {
        detail: { themeMode, isDark },
      })
    );
  }

  return isDark;
};

export const initTheme = () => {
  const current = getSavedTheme();
  applyTheme(current);

  // Listen for system changes if mode is System
  if (typeof window !== "undefined" && window.matchMedia) {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => {
      if (getSavedTheme() === "System") {
        applyTheme("System");
      }
    };
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", handler);
    } else if (mediaQuery.addListener) {
      mediaQuery.addListener(handler);
    }
  }
};
