import type { Office } from "@/features/office/types/office.types";

export type PublicAccountRole = {
  id: string;
  name: string;
};

export type PublicAccount = {
  id: string;
  username: string;
  full_name: string;
  email: string;
  phone: string;
  company_uuid: string | null;
  account_type: string;
  staff_role: string | null;
  status: boolean;
  roles: PublicAccountRole[];
  /** Every permission code the account may use, e.g. "ROUTE_UPDATE". */
  permissions: string[];
  created_at: string;
  updated_at: string;
};

export type LoginResponse = {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: string;
  account: PublicAccount;
};

export type ChangePasswordPayload = {
  current_password: string;
  new_password: string;
};

export type AuthSession = {
  account: PublicAccount | null;
  accessToken: string | null;
  refreshToken: string | null;
  /** Office chosen after login; every screen works inside it. */
  workspace: Office | null;
};

export type AuthStore = AuthSession & {
  /** `remember` keeps the session in localStorage, otherwise in sessionStorage. */
  setSession: (response: LoginResponse, remember: boolean) => void;
  /** Stores rotated tokens from /refresh, keeping the current "remember me" storage. */
  updateTokens: (response: LoginResponse) => void;
  setWorkspace: (office: Office) => void;
  clearWorkspace: () => void;
  clearSession: () => void;
};
