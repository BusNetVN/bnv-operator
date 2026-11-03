import type { Role, RolePayload } from "@/types/roles";
import { coreRequest } from "@/service/core-api";

/** Roles of the company in the access token. */
export function listRoles(query?: string) {
  const params = new URLSearchParams();
  const keyword = query?.trim();
  if (keyword) {
    params.set("q", keyword);
  }

  const suffix = params.size > 0 ? `?${params.toString()}` : "";
  return coreRequest<Role[]>(`/operator/roles${suffix}`);
}

export function createRole(input: RolePayload) {
  return coreRequest<Role>("/operator/roles", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateRole(id: string, input: RolePayload) {
  return coreRequest<Role>(`/operator/roles/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function deleteRole(id: string) {
  return coreRequest<{ id: string; name: string }>(`/operator/roles/${id}`, {
    method: "DELETE",
  });
}
