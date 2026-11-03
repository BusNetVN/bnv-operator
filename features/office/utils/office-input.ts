import type { Office, OfficeInput } from "@/features/office/types/office.types";

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
