import { useAuthStore } from "@/features/auth/stores/auth.store";
import { apiErrorMessage, refreshAccessToken, send } from "@/service/core-api";

/** NEXT_PUBLIC_BOOKING_API_URL is the gateway route of booking-service; its routes live under /api. */
const BOOKING_API_URL = `${(
  process.env.NEXT_PUBLIC_BOOKING_API_URL ?? "http://localhost:8080/booking"
).replace(/\/+$/, "")}/api`;

export class BookingApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

export async function bookingRequest<T>(path: string, init?: RequestInit) {
  const url = `${BOOKING_API_URL}${path}`;
  const headers = new Headers(init?.headers);

  if (!headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const { accessToken } = useAuthStore.getState();
  if (accessToken && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }

  let response = await send(url, init, headers);

  if (response.status === 401 && useAuthStore.getState().refreshToken) {
    const token = await refreshAccessToken();
    if (!token) {
      throw new BookingApiError(
        "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.",
        401,
      );
    }
    headers.set("Authorization", `Bearer ${token}`);
    response = await send(url, init, headers);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const payload = (await response.json().catch(() => null)) as unknown;

  if (!response.ok) {
    throw new BookingApiError(
      apiErrorMessage(payload, "Yêu cầu không thành công. Vui lòng thử lại."),
      response.status,
    );
  }

  return payload as T;
}
