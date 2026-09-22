import type { Metadata } from "next";
import { WorkspacePlaceholder } from "@/components/workspace-placeholder";

export const metadata: Metadata = {
  title: "Vé Online",
};

export default function OnlineTicketsPage() {
  return (
    <WorkspacePlaceholder
      title="Vé Online"
      description="Quản lý vé đặt trên kênh online, xác nhận và đối soát với quầy."
    />
  );
}
