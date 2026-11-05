import { z } from "zod";

import type { UserPayload } from "@/features/user/types/user.types";
import {
  companyUsernameSuffix,
  USERNAME_MAX_LENGTH,
  usernameLocalPart,
  usernameWithCompany,
} from "@/features/user/utils/user-input";

const USERNAME_PATTERN = /^[a-z0-9]+(?:[._-]?[a-z0-9]+)*$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isPhone(value: string) {
  const digits = value.replace(/\D/g, "");
  return digits.length >= 8 && digits.length <= 15;
}

/**
 * Validates the user form (same limits as the API) and returns the payload it sends.
 * The username gets the company suffix; on update an empty password keeps the current one.
 */
export function userSchema(options: { companyCode: string; isCreate: boolean }) {
  const { companyCode, isCreate } = options;
  const usernameMax = USERNAME_MAX_LENGTH - companyUsernameSuffix(companyCode).length;

  return z
    .object({
      full_name: z
        .string()
        .trim()
        .min(1, "Vui lòng nhập họ tên.")
        .max(255, "Họ tên tối đa 255 ký tự."),
      username: z
        .string()
        .transform((value) => usernameLocalPart(value, companyCode))
        .pipe(
          z
            .string()
            .min(1, "Vui lòng nhập tên đăng nhập.")
            .regex(
              USERNAME_PATTERN,
              "Tên đăng nhập chỉ gồm chữ thường, số, dấu chấm, gạch ngang hoặc gạch dưới.",
            )
            .max(
              usernameMax,
              `Tên đăng nhập tối đa ${usernameMax} ký tự trước hậu tố nhà xe.`,
            ),
        ),
      staff_role: z.enum(["ADMIN", "STAFF", "DRIVER", "ASSISTANT"], {
        error: "Vui lòng chọn vai trò.",
      }),
      role_ids: z.array(z.string()),
      phone: z
        .string()
        .trim()
        .max(32, "Số điện thoại tối đa 32 ký tự.")
        .refine((value) => !value || isPhone(value), "Số điện thoại không hợp lệ."),
      email: z
        .string()
        .trim()
        .toLowerCase()
        .max(255, "Email tối đa 255 ký tự.")
        .refine((value) => !value || EMAIL_PATTERN.test(value), "Email không hợp lệ."),
      password: isCreate
        ? z
            .string()
            .min(1, "Vui lòng nhập mật khẩu.")
            .min(8, "Mật khẩu tối thiểu 8 ký tự.")
            .max(72, "Mật khẩu tối đa 72 ký tự.")
        : z
            .string()
            .refine((value) => !value || value.length >= 8, "Mật khẩu tối thiểu 8 ký tự.")
            .refine((value) => value.length <= 72, "Mật khẩu tối đa 72 ký tự."),
      confirm_password: z.string(),
      status: z.boolean(),
    })
    .refine(
      (values) =>
        !(values.password || values.confirm_password) ||
        values.password === values.confirm_password,
      { path: ["confirm_password"], message: "Xác nhận mật khẩu không khớp." },
    )
    .transform(
      (values): UserPayload => ({
        username: usernameWithCompany(values.username, companyCode),
        ...(values.password ? { password: values.password } : {}),
        full_name: values.full_name,
        email: values.email,
        phone: values.phone,
        staff_role: values.staff_role,
        role_ids: [...new Set(values.role_ids)],
        status: values.status,
      }),
    );
}

export type UserFormValues = z.input<ReturnType<typeof userSchema>>;

/** New password set by a manager for another account (PATCH /operator/users/:id). */
export const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(1, "Vui lòng nhập mật khẩu mới.")
      .min(8, "Mật khẩu tối thiểu 8 ký tự.")
      .max(72, "Mật khẩu tối đa 72 ký tự."),
    confirm_password: z.string().min(1, "Vui lòng xác nhận mật khẩu mới."),
  })
  .refine((values) => values.password === values.confirm_password, {
    path: ["confirm_password"],
    message: "Xác nhận mật khẩu không khớp.",
  });

export type ResetPasswordFormValues = z.input<typeof resetPasswordSchema>;
