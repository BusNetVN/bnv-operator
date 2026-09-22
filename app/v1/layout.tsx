import type { Metadata } from "next";
import { DashboardShell } from "@/components/dashboard-shell";

export const metadata: Metadata = {
  title: {
    default: "Dashboard",
    template: "%s | BusNetVN",
  },
  description: "Hệ thống vận hành nhà xe BusNetVN",
};

export default function DashboardLayout({
  children,
}: LayoutProps<"/v1">) {
  return <DashboardShell>{children}</DashboardShell>;
}
