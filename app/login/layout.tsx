import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Đăng nhập",
  description: "Đăng nhập vào hệ thống BusNetVN",
};

export default function LoginLayout({ children }: LayoutProps<"/login">) {
  return children;
}
