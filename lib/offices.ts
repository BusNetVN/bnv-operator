import type { Company } from "@/lib/companies";
import { coreRequest } from "@/lib/core";

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

export function emptyOfficeInput(): OfficeInput {
  return {
    office_code: "",
    name: "",
    address: "",
    phones: [""],
    note: "",
  };
}

export function toOfficeInput(office: Office): OfficeInput {
  return {
    office_code: office.office_code.toUpperCase(),
    name: office.name,
    address: office.address,
    phones: office.phones.length ? office.phones : [""],
    note: office.note,
  };
}

export function listOffices(companyUuid: string, query?: string) {
  const params = new URLSearchParams({ company_uuid: companyUuid });
  const keyword = query?.trim();
  if (keyword) {
    params.set("q", keyword);
  }

  return coreRequest<Office[]>(`/offices?${params.toString()}`);
}

export function createOffice(companyUuid: string, input: OfficeInput) {
  return coreRequest<Office>("/offices", {
    method: "POST",
    body: JSON.stringify({
      ...input,
      company_uuid: companyUuid,
    }),
  });
}

export function updateOffice(id: string, input: OfficeInput) {
  return coreRequest<Office>(`/offices/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function deleteOffice(id: string) {
  return coreRequest<{ id: string; office_code: string }>(`/offices/${id}`, {
    method: "DELETE",
  });
}
