import type { Office, OfficeInput } from "@/features/office/types/office.types";
import { coreRequest } from "@/service/core-api";

const OFFICES_PATH = "/operator/offices";

/** Offices of the company in the access token. */
export function listOffices(query?: string) {
  const params = new URLSearchParams();
  const keyword = query?.trim();
  if (keyword) {
    params.set("q", keyword);
  }

  const suffix = params.size > 0 ? `?${params.toString()}` : "";
  return coreRequest<Office[]>(`${OFFICES_PATH}${suffix}`);
}

export function getOffice(id: string) {
  return coreRequest<Office>(`${OFFICES_PATH}/${id}`);
}

export function createOffice(input: OfficeInput) {
  return coreRequest<Office>(OFFICES_PATH, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateOffice(id: string, input: OfficeInput) {
  return coreRequest<Office>(`${OFFICES_PATH}/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function deleteOffice(id: string) {
  return coreRequest<{ id: string; office_code: string }>(
    `${OFFICES_PATH}/${id}`,
    { method: "DELETE" },
  );
}
