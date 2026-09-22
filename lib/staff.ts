import {
  identityRequest,
  type PublicAccount,
} from "@/lib/identity";

export type StaffRole = "ADMIN" | "STAFF" | "DRIVER" | "ASSISTANT";

export type Staff = PublicAccount & {
  staff_role: StaffRole | null;
  roles: PublicAccount["roles"];
};

export type StaffInput = {
  username: string;
  password: string;
  confirm_password: string;
  full_name: string;
  email: string;
  phone: string;
  staff_role: StaffRole;
  role_ids: string[];
  status: boolean;
};

export const STAFF_ROLES: { value: StaffRole; label: string }[] = [
  { value: "ADMIN", label: "Quản trị viên" },
  { value: "STAFF", label: "Nhân viên" },
  { value: "DRIVER", label: "Tài xế" },
  { value: "ASSISTANT", label: "Phụ xe" },
];

export function staffRoleLabel(role: StaffRole | null) {
  if (!role) {
    return "—";
  }
  return STAFF_ROLES.find((item) => item.value === role)?.label ?? role;
}

export function statusLabel(status: boolean) {
  return status ? "Đang hoạt động" : "Đã khóa";
}

export function staffRoleNames(staff: Staff) {
  if (!staff.roles?.length) {
    return "—";
  }

  return staff.roles.map((role) => role.name).join(", ");
}

export const USERNAME_MAX_LENGTH = 64;

export function companyUsernameSuffix(companyCode: string) {
  const code = companyCode.trim().toLowerCase();
  return code ? `.${code}` : "";
}

export function usernameLocalPart(username: string, companyCode: string) {
  const value = username.trim().toLowerCase();
  const suffix = companyUsernameSuffix(companyCode);
  if (suffix && value.endsWith(suffix)) {
    return value.slice(0, -suffix.length);
  }
  return value;
}

export function usernameWithCompany(username: string, companyCode: string) {
  const local = usernameLocalPart(username, companyCode);
  const suffix = companyUsernameSuffix(companyCode);
  if (!local) {
    return "";
  }
  return `${local}${suffix}`;
}

export function emptyStaffInput(): StaffInput {
  return {
    username: "",
    password: "",
    confirm_password: "",
    full_name: "",
    email: "",
    phone: "",
    staff_role: "STAFF",
    role_ids: [],
    status: true,
  };
}

export function toStaffInput(staff: Staff, companyCode = ""): StaffInput {
  return {
    username: usernameLocalPart(staff.username, companyCode),
    password: "",
    confirm_password: "",
    full_name: staff.full_name,
    email: staff.email,
    phone: staff.phone,
    staff_role: staff.staff_role ?? "STAFF",
    role_ids: (staff.roles ?? []).map((role) => role.id),
    status: staff.status,
  };
}

export function listStaff(companyUuid: string, query?: string) {
  const params = new URLSearchParams({ company_uuid: companyUuid });
  const keyword = query?.trim();
  if (keyword) {
    params.set("q", keyword);
  }

  return identityRequest<Staff[]>(`/accounts?${params.toString()}`);
}

export function createStaff(
  companyUuid: string,
  input: StaffInput,
  companyCode: string,
) {
  return identityRequest<Staff>("/accounts", {
    method: "POST",
    body: JSON.stringify({
      username: usernameWithCompany(input.username, companyCode),
      password: input.password,
      full_name: input.full_name.trim(),
      email: input.email.trim().toLowerCase(),
      phone: input.phone.trim(),
      company_uuid: companyUuid,
      account_type: "COMPANY_STAFF",
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
    account_type: "COMPANY_STAFF",
    staff_role: input.staff_role,
    role_ids: input.role_ids,
    status: input.status,
  };

  if (input.password.trim()) {
    payload.password = input.password;
  }

  return identityRequest<Staff>(`/accounts/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function setStaffStatus(id: string, status: boolean) {
  return identityRequest<Staff>(`/accounts/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export function resetStaffPassword(id: string, password: string) {
  return identityRequest<Staff>(`/accounts/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ password }),
  });
}

export function deleteStaff(id: string) {
  return identityRequest<{ id: string; username: string }>(`/accounts/${id}`, {
    method: "DELETE",
  });
}
