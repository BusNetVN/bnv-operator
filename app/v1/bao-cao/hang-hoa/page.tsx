import type { Metadata } from "next";
import { WorkspacePlaceholder } from "@/components/workspace-placeholder";

export const metadata: Metadata = {
  title: "Báo cáo hàng hóa",
};

export default function CargoReportPage() {
  return (
    <WorkspacePlaceholder
      title="Báo cáo hàng hóa"
      description="Đối soát sản lượng và doanh thu hàng hóa theo chuyến và tuyến."
    />
  );
}
