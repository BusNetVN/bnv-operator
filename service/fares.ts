import type { Fare, FareInput } from "@/types/fares";
import { toFarePayload } from "@/lib/fares";
import { coreRequest } from "@/service/core-api";

export function listFares(companyUuid: string) {
  const params = new URLSearchParams({ company_uuid: companyUuid });
  return coreRequest<Fare[]>(`/fares?${params.toString()}`);
}

export function createFare(companyUuid: string, input: FareInput) {
  return coreRequest<Fare>("/fares", {
    method: "POST",
    body: JSON.stringify(toFarePayload(companyUuid, input)),
  });
}

export function updateFare(id: string, input: FareInput) {
  return coreRequest<Fare>(`/fares/${id}`, {
    method: "PATCH",
    body: JSON.stringify(toFarePayload(null, input)),
  });
}

export function deleteFare(id: string) {
  return coreRequest<{ id: string }>(`/fares/${id}`, { method: "DELETE" });
}
