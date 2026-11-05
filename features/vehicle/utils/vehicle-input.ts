import type {
  Vehicle,
  VehicleCondition,
  VehicleInput,
  VehicleStatus,
} from "@/features/vehicle/types/vehicle.types";

export const VEHICLE_CONDITIONS: { value: VehicleCondition; label: string }[] = [
  { value: "NEW", label: "Nguyên chiếc" },
  { value: "REFURBISHED", label: "Cải tạo" },
];

export const VEHICLE_STATUSES: { value: VehicleStatus; label: string }[] = [
  { value: "IN_USE", label: "Đang sử dụng" },
  { value: "MAINTENANCE", label: "Đang bảo dưỡng" },
  { value: "INACTIVE", label: "Ngưng hoạt động" },
  { value: "SOLD", label: "Đã bán" },
];

export function vehicleConditionLabel(value: string) {
  return VEHICLE_CONDITIONS.find((item) => item.value === value)?.label ?? value;
}

export function vehicleStatusLabel(value: string) {
  return VEHICLE_STATUSES.find((item) => item.value === value)?.label ?? value;
}

/** Badge variant of each status in the vehicle table. */
export function vehicleStatusVariant(status: VehicleStatus) {
  if (status === "IN_USE") return "default" as const;
  if (status === "MAINTENANCE") return "secondary" as const;
  return "outline" as const;
}

export function emptyVehicleInput(): VehicleInput {
  return {
    license_plate: "",
    engine_number: "",
    chassis_number: "",
    seat_count: "",
    model_code: "",
    vehicle_kind: "",
    color: "",
    payload: "",
    initial_odometer: "",
    brand: "",
    manufacture_year: "",
    manufacture_country: "",
    service_life_year: "",
    owner_name: "",
    registration_date: "",
    office_uuid: "",
    condition: "NEW",
    status: "IN_USE",
  };
}

export function toVehicleInput(vehicle: Vehicle): VehicleInput {
  return {
    license_plate: vehicle.license_plate,
    engine_number: vehicle.engine_number,
    chassis_number: vehicle.chassis_number,
    seat_count: vehicle.seat_count ? String(vehicle.seat_count) : "",
    model_code: vehicle.model_code,
    vehicle_kind: vehicle.vehicle_kind,
    color: vehicle.color,
    payload: vehicle.payload ? String(vehicle.payload) : "",
    initial_odometer: vehicle.initial_odometer ? String(vehicle.initial_odometer) : "",
    brand: vehicle.brand,
    manufacture_year: vehicle.manufacture_year ? String(vehicle.manufacture_year) : "",
    manufacture_country: vehicle.manufacture_country,
    service_life_year: vehicle.service_life_year ? String(vehicle.service_life_year) : "",
    owner_name: vehicle.owner_name,
    registration_date: vehicle.registration_date?.slice(0, 10) ?? "",
    office_uuid: vehicle.office_uuid ?? "",
    condition: vehicle.condition,
    status: vehicle.status,
  };
}
