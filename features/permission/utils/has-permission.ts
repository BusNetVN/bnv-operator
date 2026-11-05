import type { PublicAccount } from "@/features/auth/types/auth.types";


export function hasPermission(account: PublicAccount | null, code: string) {
  return account?.permissions?.includes(code) ?? false;
}
