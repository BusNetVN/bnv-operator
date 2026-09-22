import type { Metadata } from "next";
import { WorkspacePlaceholder } from "@/components/workspace-placeholder";

export const metadata: Metadata = {
  title: "Doanh thu",
};

export default function RevenueReportPage() {
  return (
    <WorkspacePlaceholder
      title="Báo cáo doanh thu"
      description="Tổng hợp doanh thu theo ngày, tuyến, chuyến và kênh bán."
    />
  );
}
