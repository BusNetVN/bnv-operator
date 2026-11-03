import type { Metadata } from "next";
import { OfficesPage } from "@/features/office/components/offices-page";

export const metadata: Metadata = {
  title: "Văn phòng",
};

export default function Page() {
  return <OfficesPage />;
}
