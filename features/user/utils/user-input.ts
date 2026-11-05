import type {
  StaffRole,
  User,
  UserInput,
} from "@/features/user/types/user.types";

export const STAFF_ROLES: { value: StaffRole; label: string }[] = [
  { value: "ADMIN", label: "Quản trị viên" },
  { value: "STAFF", label: "Nhân viên" },
  { value: "DRIVER", label: "Tài xế" },
  { value: "ASSISTANT", label: "Phụ xe" },
];

/** Same limit as the API, suffix included. */
export const USERNAME_MAX_LENGTH = 64;

export function staffRoleLabel(role: StaffRole | null) {
  if (!role) {
    return "—";
  }
  return STAFF_ROLES.find((item) => item.value === role)?.label ?? role;
}

export function statusLabel(status: boolean) {
  return status ? "Đang hoạt động" : "Đã khóa";
}

export function userRoleNames(user: User) {
  if (!user.roles?.length) {
    return "—";
  }
  return user.roles.map((role) => role.name).join(", ");
}

/** Usernames end with ".<company code>" so they stay unique across companies. */
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
  if (!local) {
    return "";
  }
  return `${local}${companyUsernameSuffix(companyCode)}`;
}

export function emptyUserInput(): UserInput {
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

export function toUserInput(user: User, companyCode = ""): UserInput {
  return {
    username: usernameLocalPart(user.username, companyCode),
    password: "",
    confirm_password: "",
    full_name: user.full_name,
    email: user.email,
    phone: user.phone,
    staff_role: user.staff_role ?? "STAFF",
    role_ids: (user.roles ?? []).map((role) => role.id),
    status: user.status,
  };
}
