import type { Metadata } from "next";
import { WorkspacePlaceholder } from "@/components/workspace-placeholder";

export const metadata: Metadata = {
  title: "Hàng hóa",
};

export default function CargoPage() {
  return (
    <WorkspacePlaceholder
      title="Hàng hóa"
      description="Nhận gửi, theo dõi và đối soát hàng hóa theo chuyến xe."
    />
  );
}
