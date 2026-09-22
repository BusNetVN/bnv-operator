import { getAccessToken } from "@/lib/auth-session";

export type PublicAccount = {
  id: string;
  username: string;
  full_name: string;
  email: string;
  phone: string;
  company_uuid: string | null;
  account_type: string;
  staff_role: string | null;
  status: boolean;
  roles: PublicAccountRole[];
  permissions: string[];
  created_at: string;
  updated_at: string;
};

export type PublicAccountRole = {
  id: string;
  name: string;
  status: boolean;
};

export type LoginResponse = {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: string;
  account: PublicAccount;
};

const IDENTITY_API_URL =
  process.env.NEXT_PUBLIC_IDENTITY_API_URL ?? "http://localhost:8002/api";

export class IdentityApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

function errorMessage(payload: unknown, fallback: string) {
  if (payload && typeof payload === "object" && "message" in payload) {
    const message = (payload as { message?: unknown }).message;
    if (typeof message === "string" && message.trim()) {
      return message;
    }
    if (Array.isArray(message) && typeof message[0] === "string") {
      return message[0];
    }
  }

  return fallback;
}

export async function identityRequest<T>(path: string, init?: RequestInit) {
  let response: Response;
  const accessToken = getAccessToken();
  const headers = new Headers(init?.headers);

  if (!headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (accessToken && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }

  try {
    response = await fetch(`${IDENTITY_API_URL}${path}`, {
      ...init,
      headers,
    });
  } catch {
    throw new Error("Không kết nối được máy chủ. Vui lòng thử lại.");
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const payload = (await response.json().catch(() => null)) as unknown;

  if (!response.ok) {
    throw new IdentityApiError(
      errorMessage(payload, "Yêu cầu không thành công. Vui lòng thử lại."),
      response.status,
    );
  }

  return payload as T;
}

export async function loginWithPassword(input: {
  username: string;
  password: string;
}) {
  return identityRequest<LoginResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({
      username: input.username,
      password: input.password,
      client: "operator",
    }),
  });
}

export async function changePassword(
  accessToken: string,
  input: { current_password: string; new_password: string },
) {
  await identityRequest("/auth/change-password", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(input),
  });
}
