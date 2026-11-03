"use client";

import { useState } from "react";

import type { LoginInput } from "@/features/auth/schemas/login.schema";
import { loginWithPassword } from "@/features/auth/services/auth.service";
import { useAuthStore } from "@/features/auth/stores/auth.store";

/** Signs in and stores the session; `remember` keeps it after the browser is closed. */
export function useLogin() {
  const setSession = useAuthStore((state) => state.setSession);
  const [pending, setPending] = useState(false);

  async function login(input: LoginInput, remember: boolean) {
    setPending(true);
    try {
      const result = await loginWithPassword(input);
      setSession(result, remember);
      return result;
    } finally {
      setPending(false);
    }
  }

  return { login, pending };
}
