import { z } from "zod";

/** Same rule as the API (CreateOfficeDto). */
export const OFFICE_CODE_PATTERN = /^[A-Z0-9]+(?:[._-]?[A-Z0-9]+)*$/;

function isPhone(value: string) {
  const digits = value.replace(/\D/g, "");
  return digits.length >= 8 && digits.length <= 15;
}

/** Validates the office form and returns the payload sent to the API (trimmed, phones de-duplicated). */
export const officeSchema = z.object({
  office_code: z
    .string()
    .trim()
    .toUpperCase()
    .min(1, "Vui lòng nhập mã văn phòng.")
    .max(32, "Mã văn phòng tối đa 32 ký tự.")
    .regex(
      OFFICE_CODE_PATTERN,
      "Mã văn phòng chỉ gồm chữ in hoa, số, dấu chấm, gạch ngang hoặc gạch dưới.",
    ),
  name: z
    .string()
    .trim()
    .min(1, "Vui lòng nhập tên văn phòng.")
    .max(180, "Tên văn phòng tối đa 180 ký tự."),
  address: z
    .string()
    .trim()
    .min(1, "Vui lòng nhập địa chỉ văn phòng.")
    .max(500, "Địa chỉ tối đa 500 ký tự."),
  phones: z
    .array(z.string())
    .transform((phones) => [
      ...new Set(phones.map((phone) => phone.trim()).filter(Boolean)),
    ])
    .pipe(
      z
        .array(
          z
            .string()
            .max(20, "Số điện thoại tối đa 20 ký tự.")
            .refine(isPhone, "Số điện thoại không hợp lệ."),
        )
        .min(1, "Vui lòng nhập ít nhất một số điện thoại."),
    ),
  note: z.string().trim().max(1000, "Ghi chú tối đa 1000 ký tự."),
});

export type OfficeFormValues = z.input<typeof officeSchema>;
