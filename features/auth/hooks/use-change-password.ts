"use client";

import { useState } from "react";

import { changePassword as requestChangePassword } from "@/features/auth/services/auth.service";
import type { ChangePasswordPayload } from "@/features/auth/types/auth.types";

export function useChangePassword() {
  const [pending, setPending] = useState(false);

  async function changePassword(input: ChangePasswordPayload) {
    setPending(true);
    try {
      await requestChangePassword(input);
    } finally {
      setPending(false);
    }
  }

  return { changePassword, pending };
}
