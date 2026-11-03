import { z } from "zod";

/** Same limits as the API (POST /operator/auth/login). */
export const loginSchema = z.object({
  username: z
    .string()
    .trim()
    .toLowerCase()
    .min(1, "Vui lòng nhập tên đăng nhập.")
    .max(64, "Tên đăng nhập tối đa 64 ký tự."),
  password: z
    .string()
    .min(1, "Vui lòng nhập mật khẩu.")
    .max(72, "Mật khẩu tối đa 72 ký tự."),
});

export type LoginInput = z.infer<typeof loginSchema>;
