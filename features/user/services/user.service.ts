import type { User, UserPayload } from "@/features/user/types/user.types";
import { coreRequest } from "@/service/core-api";

const USERS_PATH = "/operator/users";

/** COMPANY_STAFF accounts of the company in the access token, newest first. */
export function listUsers(query?: string) {
  const params = new URLSearchParams();
  const keyword = query?.trim();
  if (keyword) {
    params.set("q", keyword);
  }

  const suffix = params.size > 0 ? `?${params.toString()}` : "";
  return coreRequest<User[]>(`${USERS_PATH}${suffix}`);
}

export function createUser(input: UserPayload) {
  return coreRequest<User>(USERS_PATH, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateUser(id: string, input: UserPayload) {
  return coreRequest<User>(`${USERS_PATH}/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

/** Locks (false) or unlocks (true) the account. */
export function setUserStatus(id: string, status: boolean) {
  return coreRequest<User>(`${USERS_PATH}/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export function resetUserPassword(id: string, password: string) {
  return coreRequest<User>(`${USERS_PATH}/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ password }),
  });
}

/** Soft delete: the account is locked and hidden; its username stays reserved. */
export function deleteUser(id: string) {
  return coreRequest<{ id: string; username: string }>(`${USERS_PATH}/${id}`, {
    method: "DELETE",
  });
}
