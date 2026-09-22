import type { Metadata } from "next";
import { SchedulesPage } from "@/components/schedules-page";

export const metadata: Metadata = {
  title: "Lịch chạy",
};

export default function Page() {
  return <SchedulesPage />;
}
