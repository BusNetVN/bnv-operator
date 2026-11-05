import type { PublicAccountRole } from "@/features/auth/types/auth.types";

export type StaffRole = "ADMIN" | "STAFF" | "DRIVER" | "ASSISTANT";

/** COMPANY_STAFF account of the company in the access token (GET /operator/users). */
export type User = {
  id: string;
  username: string;
  full_name: string;
  email: string;
  phone: string;
  company_uuid: string | null;
  account_type: string;
  staff_role: StaffRole | null;
  /** Roles (nhóm quyền) of the company granted to the account. */
  roles: PublicAccountRole[];
  status: boolean;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
};

/** Values of the user form; `username` is the part before the company suffix. */
export type UserInput = {
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

/** Body of POST/PATCH /operator/users; `password` is omitted to keep the current one. */
export type UserPayload = {
  username: string;
  password?: string;
  full_name: string;
  email: string;
  phone: string;
  staff_role: StaffRole;
  role_ids: string[];
  status: boolean;
};
