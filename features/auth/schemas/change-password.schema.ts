import { z } from "zod";

/** Same limits as the API (POST /operator/auth/change-password). */
export const changePasswordSchema = z
  .object({
    current_password: z.string().min(1, "Vui lòng nhập mật khẩu hiện tại."),
    new_password: z
      .string()
      .min(1, "Vui lòng nhập mật khẩu mới.")
      .min(8, "Mật khẩu mới tối thiểu 8 ký tự.")
      .max(72, "Mật khẩu mới tối đa 72 ký tự."),
    confirm_password: z.string().min(1, "Vui lòng xác nhận mật khẩu mới."),
  })
  .superRefine((values, context) => {
    if (values.new_password === values.current_password) {
      context.addIssue({
        code: "custom",
        path: ["new_password"],
        message: "Mật khẩu mới phải khác mật khẩu hiện tại.",
      });
    }
    if (values.confirm_password !== values.new_password) {
      context.addIssue({
        code: "custom",
        path: ["confirm_password"],
        message: "Xác nhận mật khẩu không khớp.",
      });
    }
  });

export type ChangePasswordForm = z.input<typeof changePasswordSchema>;
