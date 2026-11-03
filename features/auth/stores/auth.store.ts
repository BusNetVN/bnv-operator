"use client";

import { create } from "zustand";
import {
  createJSONStorage,
  persist,
  type StateStorage,
} from "zustand/middleware";

import type { AuthSession, AuthStore } from "@/features/auth/types/auth.types";

const STORAGE_KEY = "bnv-operator-auth";
let rememberSession = true;

/** "Remember me" keeps the session in localStorage, otherwise only for the browser tab session. */
const authStorage: StateStorage = {
  getItem(name) {
    if (typeof window === "undefined") {
      return null;
    }

    const persistentValue = window.localStorage.getItem(name);
    if (persistentValue) {
      rememberSession = true;
      return persistentValue;
    }

    const temporaryValue = window.sessionStorage.getItem(name);
    if (temporaryValue) {
      rememberSession = false;
    }
    return temporaryValue;
  },
  setItem(name, value) {
    if (typeof window === "undefined") {
      return;
    }

    const storage = rememberSession ? window.localStorage : window.sessionStorage;
    const otherStorage = rememberSession
      ? window.sessionStorage
      : window.localStorage;
    otherStorage.removeItem(name);
    storage.setItem(name, value);
  },
  removeItem(name) {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.removeItem(name);
    window.sessionStorage.removeItem(name);
  },
};

const EMPTY_SESSION: AuthSession = {
  account: null,
  accessToken: null,
  refreshToken: null,
  workspace: null,
};

export const useAuthStore = create<AuthStore>()(
  persist<AuthStore, [], [], AuthSession>(
    (set) => ({
      ...EMPTY_SESSION,
      setSession: (response, remember) => {
        rememberSession = remember;
        set({
          account: response.account,
          accessToken: response.access_token,
          refreshToken: response.refresh_token,
          workspace: null,
        });
      },
      updateTokens: (response) => {
        set({
          account: response.account,
          accessToken: response.access_token,
          refreshToken: response.refresh_token,
        });
      },
      setWorkspace: (office) => {
        set({ workspace: office });
      },
      clearWorkspace: () => {
        set({ workspace: null });
      },
      clearSession: () => {
        set(EMPTY_SESSION);
        authStorage.removeItem(STORAGE_KEY);
      },
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => authStorage),
      partialize: ({ account, accessToken, refreshToken, workspace }) => ({
        account,
        accessToken,
        refreshToken,
        workspace,
      }),
    },
  ),
);
