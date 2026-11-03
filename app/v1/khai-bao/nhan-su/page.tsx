import type { Metadata } from "next";
import { StaffPage } from "@/components/declare/staff-page";

export const metadata: Metadata = {
  title: "Nhân sự",
};

export default function Page() {
  return <StaffPage />;
}
