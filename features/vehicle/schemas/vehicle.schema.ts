import { z } from "zod";

import type { VehiclePayload } from "@/features/vehicle/types/vehicle.types";

function text(max: number, label: string) {
  return z.string().trim().max(max, `${label} tối đa ${max} ký tự.`);
}

/** Empty -> 0, otherwise a number >= 0 (and an integer <= `maxInt` when given). */
function amount(message: string, maxInt?: number) {
  return z
    .string()
    .trim()
    .refine((value) => {
      if (!value) return true;
      const next = Number(value);
      if (!Number.isFinite(next) || next < 0) return false;
      return maxInt === undefined || (Number.isInteger(next) && next <= maxInt);
    }, message)
    .transform((value) => (value ? Number(value) : 0));
}

/** Empty -> null (clears the field), otherwise a year between 1900 and 2200. */
function year(message: string) {
  return z
    .string()
    .trim()
    .refine((value) => {
      if (!value) return true;
      const next = Number(value);
      return Number.isInteger(next) && next >= 1900 && next <= 2200;
    }, message)
    .transform((value) => (value ? Number(value) : null));
}

/** Validates the vehicle form (same limits as the API) and returns the payload it sends. */
export const vehicleSchema = z
  .object({
    license_plate: z
      .string()
      .trim()
      .toUpperCase()
      .min(1, "Vui lòng nhập biển số xe.")
      .max(32, "Biển số xe tối đa 32 ký tự."),
    engine_number: text(64, "Số máy"),
    chassis_number: text(64, "Số khung"),
    seat_count: amount("Số chỗ là số nguyên từ 0 đến 200.", 200),
    model_code: text(64, "Số loại"),
    vehicle_kind: text(64, "Loại xe"),
    color: text(64, "Màu sơn"),
    payload: amount("Khối lượng toàn bộ phải là số không âm."),
    initial_odometer: amount("Công tơ mét ban đầu phải là số không âm."),
    brand: text(64, "Nhãn hiệu"),
    manufacture_year: year("Năm sản xuất phải từ 1900 đến 2200."),
    manufacture_country: text(64, "Nước sản xuất"),
    service_life_year: year("Niên hạn phải từ 1900 đến 2200."),
    owner_name: text(180, "Tên chủ xe"),
    registration_date: z
      .string()
      .trim()
      .transform((value) => value || null),
    office_uuid: z.string().transform((value) => value || null),
    condition: z.enum(["NEW", "REFURBISHED"], { error: "Tình trạng xe không hợp lệ." }),
    status: z.enum(["IN_USE", "MAINTENANCE", "INACTIVE", "SOLD"], {
      error: "Trạng thái không hợp lệ.",
    }),
  })
  .transform((values): VehiclePayload => values);

export type VehicleFormValues = z.input<typeof vehicleSchema>;
