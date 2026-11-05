import type { Metadata } from "next";
import { VehiclesPage } from "@/features/vehicle/components/vehicles-page";

export const metadata: Metadata = {
  title: "Phương tiện",
};

export default function Page() {
  return <VehiclesPage />;
}
