import React, { useState, useEffect, useCallback } from "react";

export type UserPreferences = {
  viewSettings?: Record<string, unknown>;
};
const STORAGE_KEY = "resource-framework:preferences";

export function useUserPreferences(): [
  UserPreferences,
  (next: UserPreferences) => void,
] {
  const [prefs, setPrefs] = useState<UserPreferences>({});

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setPrefs(JSON.parse(raw));
    } catch {
      // ignore
    }
  }, []);

  const save = useCallback((next: UserPreferences) => {
    setPrefs(next);

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // ignore
    }
  }, []);

  return [prefs, save];
}
