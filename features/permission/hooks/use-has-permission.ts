"use client";

import { useAuthStore } from "@/features/auth/stores/auth.store";
import { hasPermission } from "@/features/permission/utils/has-permission";

/**
 * Whether the signed-in account has at least one of `codes` (e.g. "ROUTE_UPDATE").
 * Use it below DashboardShell, which only renders pages once the session is loaded.
 */
export function useHasPermission(...codes: string[]) {
  const account = useAuthStore((state) => state.account);
  return codes.some((code) => hasPermission(account, code));
}
