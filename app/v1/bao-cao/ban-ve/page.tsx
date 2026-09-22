import type { Metadata } from "next";
import { WorkspacePlaceholder } from "@/components/workspace-placeholder";

export const metadata: Metadata = {
  title: "Báo cáo bán vé",
};

export default function TicketSalesReportPage() {
  return (
    <WorkspacePlaceholder
      title="Báo cáo bán vé"
      description="Thống kê vé bán tại quầy theo nhân viên, chuyến và trạng thái vé."
    />
  );
}
