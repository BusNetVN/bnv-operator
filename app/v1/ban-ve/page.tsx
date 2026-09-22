import type { Metadata } from "next";
import { WorkspacePlaceholder } from "@/components/workspace-placeholder";

export const metadata: Metadata = {
  title: "Bán vé",
};

export default function TicketSalesPage() {
  return (
    <WorkspacePlaceholder
      title="Bán vé"
      description="Bán vé tại quầy theo chuyến, tuyến và ghế còn trống."
    />
  );
}
