import type { LoginInput } from "@/features/auth/schemas/login.schema";
import type {
  ChangePasswordPayload,
  LoginResponse,
} from "@/features/auth/types/auth.types";
import { useAuthStore } from "@/features/auth/stores/auth.store";
import { coreRequest } from "@/service/core-api";

export function loginWithPassword(input: LoginInput) {
  return coreRequest<LoginResponse>(
    "/operator/auth/login",
    {
      method: "POST",
      body: JSON.stringify(input),
    },
    { auth: false },
  );
}

/** Ends the local session at once; revoking it on the server is best effort. */
export function logout() {
  const { refreshToken, clearSession } = useAuthStore.getState();
  clearSession();
  if (refreshToken) {
    void coreRequest(
      "/operator/auth/logout",
      {
        method: "POST",
        body: JSON.stringify({ refresh_token: refreshToken }),
      },
      { auth: false },
    ).catch(() => undefined);
  }
}

/** Changes the password of the signed-in account. */
export async function changePassword(input: ChangePasswordPayload) {
  await coreRequest("/operator/auth/change-password", {
    method: "POST",
    body: JSON.stringify(input),
  });
}
