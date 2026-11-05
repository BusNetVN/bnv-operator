import type { Office, OfficeInput } from "@/features/office/types/office.types";

export function statusLabel(isActive: boolean) {
  return isActive ? "Đang hoạt động" : "Ngưng hoạt động";
}

export function emptyOfficeInput(): OfficeInput {
  return {
    office_code: "",
    name: "",
    address: "",
    phones: [""],
    note: "",
    is_active: true,
  };
}

export function toOfficeInput(office: Office): OfficeInput {
  return {
    office_code: office.office_code.toUpperCase(),
    name: office.name,
    address: office.address,
    phones: office.phones.length ? office.phones : [""],
    note: office.note,
    is_active: office.is_active ?? true,
  };
}
