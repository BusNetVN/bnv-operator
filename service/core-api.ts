import type { LoginResponse } from "@/features/auth/types/auth.types";
import { useAuthStore } from "@/features/auth/stores/auth.store";
import type {
  ApiErrorResponse,
  ApiSuccessResponse,
  LegacyErrorResponse,
} from "@/types/api";

/** NEXT_PUBLIC_CORE_API_URL is the gateway route of core-service; its routes live under /api. */
const CORE_API_URL = `${(
  process.env.NEXT_PUBLIC_CORE_API_URL ?? "http://localhost:8080/core"
).replace(/\/+$/, "")}/api`;

const LOGIN_PATH = "/dang-nhap";
const SESSION_EXPIRED_MESSAGE =
  "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.";
/** The server rejected the refresh token itself; anything else (5xx, offline) may be retried. */
const REJECTED_REFRESH_STATUSES = new Set([400, 401, 403]);

export class CoreApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

function isApiErrorResponse(payload: unknown): payload is ApiErrorResponse {
  return (
    typeof payload === "object" &&
    payload !== null &&
    (payload as ApiErrorResponse).success === false &&
    typeof (payload as ApiErrorResponse).error === "object"
  );
}

function isApiSuccessResponse<T>(payload: unknown): payload is ApiSuccessResponse<T> {
  return (
    typeof payload === "object" &&
    payload !== null &&
    (payload as ApiSuccessResponse<T>).success === true &&
    "data" in payload
  );
}

/** Message of an error body, from core-service (ApiErrorResponse) or booking-service (legacy). */
export function apiErrorMessage(payload: unknown, fallback: string) {
  if (isApiErrorResponse(payload)) {
    return payload.error.message || fallback;
  }

  const message = (payload as LegacyErrorResponse | null)?.message;
  if (typeof message === "string" && message.trim()) {
    return message;
  }
  if (Array.isArray(message) && typeof message[0] === "string") {
    return message[0];
  }

  return fallback;
}

function unwrapData<T>(payload: unknown) {
  return (isApiSuccessResponse<T>(payload) ? payload.data : payload) as T;
}

export async function send(
  url: string,
  init: RequestInit | undefined,
  headers: Headers,
) {
  try {
    return await fetch(url, { ...init, headers });
  } catch {
    throw new Error("Không kết nối được máy chủ. Vui lòng thử lại.");
  }
}

/** Clears the session and sends the user to the login page. */
export function endSession() {
  useAuthStore.getState().clearSession();
  if (typeof window !== "undefined" && window.location.pathname !== LOGIN_PATH) {
    window.location.replace(LOGIN_PATH);
  }
}

let pendingRefresh: Promise<string | null> | null = null;

/**
 * Exchanges the refresh token for new tokens. A refresh token works only once, so concurrent
 * callers share one exchange. Resolves to null (and ends the session) when it is rejected.
 */
export function refreshAccessToken() {
  pendingRefresh ??= rotateTokens().finally(() => {
    pendingRefresh = null;
  });
  return pendingRefresh;
}

async function rotateTokens() {
  const { refreshToken } = useAuthStore.getState();
  if (!refreshToken) {
    return null;
  }

  const headers = new Headers({ "Content-Type": "application/json" });
  const response = await send(
    `${CORE_API_URL}/operator/auth/refresh`,
    { method: "POST", body: JSON.stringify({ refresh_token: refreshToken }) },
    headers,
  );
  if (!response.ok) {
    if (REJECTED_REFRESH_STATUSES.has(response.status)) {
      endSession();
      return null;
    }
    throw new CoreApiError(
      "Không làm mới được phiên đăng nhập. Vui lòng thử lại.",
      response.status,
    );
  }

  const result = unwrapData<LoginResponse>(await response.json());
  useAuthStore.getState().updateTokens(result);
  return result.access_token;
}

/** `auth: false` sends no token and never refreshes (login, logout). */
export async function coreRequest<T>(
  path: string,
  init?: RequestInit,
  options: { auth?: boolean } = {},
) {
  const useSession = options.auth !== false;
  const url = `${CORE_API_URL}${path}`;
  const headers = new Headers(init?.headers);

  if (!headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const accessToken = useSession ? useAuthStore.getState().accessToken : null;
  if (accessToken && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }

  let response = await send(url, init, headers);

  if (
    useSession &&
    response.status === 401 &&
    useAuthStore.getState().refreshToken
  ) {
    const token = await refreshAccessToken();
    if (!token) {
      throw new CoreApiError(SESSION_EXPIRED_MESSAGE, 401);
    }
    headers.set("Authorization", `Bearer ${token}`);
    response = await send(url, init, headers);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const payload = (await response.json().catch(() => null)) as unknown;

  if (!response.ok) {
    throw new CoreApiError(
      apiErrorMessage(payload, "Yêu cầu không thành công. Vui lòng thử lại."),
      response.status,
    );
  }

  return unwrapData<T>(payload);
}
