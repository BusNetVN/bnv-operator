import { z } from "zod";

import type { RolePayload } from "@/features/permission/types/role.types";

/**
 * Validates the role form (same limits as the API) and returns the payload it sends.
 * Name uniqueness within the company is checked by the caller, which knows the other roles.
 */
export const roleSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, "Vui lòng nhập tên nhóm quyền.")
      .max(120, "Tên nhóm quyền tối đa 120 ký tự."),
    description: z.string().trim().max(1000, "Mô tả tối đa 1000 ký tự."),
    status: z.boolean(),
    permission_ids: z
      .array(z.string())
      .min(1, "Vui lòng chọn ít nhất một chức năng."),
  })
  .transform(
    (values): RolePayload => ({
      name: values.name,
      description: values.description,
      is_active: values.status,
      permission_ids: [...new Set(values.permission_ids)],
    }),
  );

export type RoleFormValues = z.input<typeof roleSchema>;
