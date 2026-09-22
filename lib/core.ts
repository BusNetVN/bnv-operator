import { getAccessToken } from "@/lib/auth-session";

const CORE_API_URL =
  process.env.NEXT_PUBLIC_CORE_API_URL ?? "http://localhost:8080/core/api";

export class CoreApiError extends Error {
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

export async function coreRequest<T>(path: string, init?: RequestInit) {
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
    response = await fetch(`${CORE_API_URL}${path}`, {
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
    throw new CoreApiError(
      errorMessage(payload, "Yêu cầu không thành công. Vui lòng thử lại."),
      response.status,
    );
  }

  return payload as T;
}
