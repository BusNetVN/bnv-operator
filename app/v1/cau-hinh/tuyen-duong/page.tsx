import type { Metadata } from "next";
import { RouteConfigPage } from "@/components/config/routes/route-config-page";

export const metadata: Metadata = {
  title: "Tuyến đường",
};

export default function Page() {
  return <RouteConfigPage />;
}
