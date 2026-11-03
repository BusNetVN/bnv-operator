import type { Metadata } from "next";
import { SeatMapsPage } from "@/components/declare/seat-maps-page";

export const metadata: Metadata = {
  title: "Sơ đồ ghế",
};

export default function Page() {
  return <SeatMapsPage />;
}
