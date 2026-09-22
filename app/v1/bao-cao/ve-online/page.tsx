import type { Metadata } from "next";
import { WorkspacePlaceholder } from "@/components/workspace-placeholder";

export const metadata: Metadata = {
  title: "Báo cáo vé online",
};

export default function OnlineTicketReportPage() {
  return (
    <WorkspacePlaceholder
      title="Báo cáo vé online"
      description="Thống kê vé đặt online, tỷ lệ xác nhận và đối soát kênh bán."
    />
  );
}
