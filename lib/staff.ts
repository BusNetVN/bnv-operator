import type { Staff, StaffInput, StaffRole } from "@/types/staff";

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
