import type { Vehicle, VehiclePayload } from "@/features/vehicle/types/vehicle.types";
import { coreRequest } from "@/service/core-api";

const VEHICLES_PATH = "/operator/vehicles";

/** Vehicles of the company in the access token. */
export function listVehicles(query?: string) {
  const params = new URLSearchParams();
  const keyword = query?.trim();
  if (keyword) {
    params.set("q", keyword);
  }

  const suffix = params.size > 0 ? `?${params.toString()}` : "";
  return coreRequest<Vehicle[]>(`${VEHICLES_PATH}${suffix}`);
}

/** The company comes from the access token. */
export function createVehicle(input: VehiclePayload) {
  return coreRequest<Vehicle>(VEHICLES_PATH, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateVehicle(id: string, input: VehiclePayload) {
  return coreRequest<Vehicle>(`${VEHICLES_PATH}/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function deleteVehicle(id: string) {
  return coreRequest<{ id: string; license_plate: string }>(`${VEHICLES_PATH}/${id}`, {
    method: "DELETE",
  });
}
