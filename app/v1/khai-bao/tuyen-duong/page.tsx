import type { Metadata } from "next";
import { RoutesPage } from "@/components/routes-page";

export const metadata: Metadata = {
  title: "Tuyến đường",
};

export default function Page() {
  return <RoutesPage />;
}
