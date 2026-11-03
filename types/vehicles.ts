export type VehicleCondition = "NEW" | "REFURBISHED";
export type VehicleStatus = "IN_USE" | "MAINTENANCE" | "INACTIVE" | "SOLD";

export type Vehicle = {
  id: string;
  company_uuid: string;
  license_plate: string;
  engine_number: string;
  chassis_number: string;
  seat_count: number;
  model_code: string;
  vehicle_kind: string;
  color: string;
  payload: number;
  initial_odometer: number;
  brand: string;
  manufacture_year: number | null;
  manufacture_country: string;
  service_life_year: number | null;
  owner_name: string;
  registration_date: string | null;
  office_uuid: string | null;
  office: { id: string; office_code: string; name: string } | null;
  condition: VehicleCondition;
  status: VehicleStatus;
  created_at: string;
  updated_at: string;
};

export type VehicleInput = {
  license_plate: string;
  engine_number: string;
  chassis_number: string;
  seat_count: string;
  model_code: string;
  vehicle_kind: string;
  color: string;
  payload: string;
  initial_odometer: string;
  brand: string;
  manufacture_year: string;
  manufacture_country: string;
  service_life_year: string;
  owner_name: string;
  registration_date: string;
  office_uuid: string;
  condition: VehicleCondition;
  status: VehicleStatus;
};

/** Trimmed form values; empty strings are sent as-is so the backend clears nullable fields. */
export type VehiclePayload = VehicleInput;
