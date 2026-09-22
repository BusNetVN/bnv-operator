import type { Metadata } from "next";
import { WorkspacePlaceholder } from "@/components/workspace-placeholder";

export const metadata: Metadata = {
  title: "Giá vé",
};

export default function FaresPage() {
  return (
    <WorkspacePlaceholder
      title="Giá vé"
      description="Khai báo bảng giá theo tuyến, hạng ghế và ngày chạy."
    />
  );
}
