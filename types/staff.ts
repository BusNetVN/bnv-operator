import type { PublicAccountRole } from "@/features/auth/types/auth.types";

export type StaffRole = "ADMIN" | "STAFF" | "DRIVER" | "ASSISTANT";

export type Staff = {
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
