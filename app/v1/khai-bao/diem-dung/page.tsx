import type { Metadata } from "next";
import { PointsPage } from "@/components/declare/points-page";

export const metadata: Metadata = {
  title: "Điểm dừng",
};

export default function Page() {
  return <PointsPage />;
}
