/** Response format of core-service (see core-service-nestjs/src/common/http/api-response.ts). */

export type ResponseMeta = {
  request_id: string;
  latency_ms: number;
  /** Method and path, e.g. "POST /api/operator/auth/login". */
  endpoint: string;
  /** ISO 8601 time the response was built. */
  timestamp: string;
};

export type ApiSuccessResponse<T> = {
  success: true;
  data: T;
  meta: ResponseMeta;
};

export type ApiError = {
  /** e.g. "UNAUTHORIZED", "NOT_FOUND", "VALIDATION_FAILED"; the HTTP status carries the number. */
  code: string;
  message: string;
};

export type ApiErrorResponse = {
  success: false;
  error: ApiError;
};

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

/** booking-service has not moved to this format yet: its errors put `message` at the top level. */
export type LegacyErrorResponse = {
  message?: string | string[];
};
