import type { Vehicle, VehiclePayload } from "@/types/vehicles";
import { coreRequest } from "@/service/core-api";

export function listVehicles(companyUuid: string, query?: string) {
  const params = new URLSearchParams({ company_uuid: companyUuid });
  const keyword = query?.trim();
  if (keyword) {
    params.set("q", keyword);
  }

  return coreRequest<Vehicle[]>(`/vehicles?${params.toString()}`);
}

export function createVehicle(companyUuid: string, input: VehiclePayload) {
  return coreRequest<Vehicle>("/vehicles", {
    method: "POST",
    body: JSON.stringify({ ...input, company_uuid: companyUuid }),
  });
}

export function updateVehicle(id: string, input: VehiclePayload) {
  return coreRequest<Vehicle>(`/vehicles/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function deleteVehicle(id: string) {
  return coreRequest<{ id: string; license_plate: string }>(`/vehicles/${id}`, {
    method: "DELETE",
  });
}
