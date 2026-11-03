import type { Staff, StaffInput } from "@/types/staff";
import { usernameWithCompany } from "@/lib/staff";
import { coreRequest } from "@/service/core-api";

/** Staff of the company in the access token. */
export function listStaff(query?: string) {
  const params = new URLSearchParams();
  const keyword = query?.trim();
  if (keyword) {
    params.set("q", keyword);
  }

  const suffix = params.size > 0 ? `?${params.toString()}` : "";
  return coreRequest<Staff[]>(`/operator/staff${suffix}`);
}

export function createStaff(input: StaffInput, companyCode: string) {
  return coreRequest<Staff>("/operator/staff", {
    method: "POST",
    body: JSON.stringify({
      username: usernameWithCompany(input.username, companyCode),
      password: input.password,
      full_name: input.full_name.trim(),
      email: input.email.trim().toLowerCase(),
      phone: input.phone.trim(),
      staff_role: input.staff_role,
      role_ids: input.role_ids,
      status: input.status,
    }),
  });
}

export function updateStaff(
  id: string,
  input: StaffInput,
  companyCode: string,
) {
  const payload: Record<string, unknown> = {
    username: usernameWithCompany(input.username, companyCode),
    full_name: input.full_name.trim(),
    email: input.email.trim().toLowerCase(),
    phone: input.phone.trim(),
    staff_role: input.staff_role,
    role_ids: input.role_ids,
    status: input.status,
  };

  if (input.password.trim()) {
    payload.password = input.password;
  }

  return coreRequest<Staff>(`/operator/staff/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function setStaffStatus(id: string, status: boolean) {
  return coreRequest<Staff>(`/operator/staff/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export function resetStaffPassword(id: string, password: string) {
  return coreRequest<Staff>(`/operator/staff/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ password }),
  });
}

export function deleteStaff(id: string) {
  return coreRequest<{ id: string; username: string }>(`/operator/staff/${id}`, {
    method: "DELETE",
  });
}
