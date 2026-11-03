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
  created_at: string;
  updated_at: string;
};

export type OfficeInput = {
  office_code: string;
  name: string;
  address: string;
  phones: string[];
  note: string;
};
