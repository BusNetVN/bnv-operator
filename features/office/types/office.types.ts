import type { Company } from "@/types/companies";

export type Office = {
  id: string;
  company_uuid: string;
  company: Company;
  office_code: string;
  name: string;
  address: string;
  phones: string[];
  note: string;
  /** false when the office has stopped working; it cannot be chosen as the working office. */
  is_active: boolean;
  /** Username of the account that created / last updated the office (null for older rows). */
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
};

export type OfficeInput = {
  office_code: string;
  name: string;
  address: string;
  phones: string[];
  note: string;
  is_active: boolean;
};
