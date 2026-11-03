import type { Metadata } from "next";
import { FaresPage } from "@/components/config/fares/fares-page";

export const metadata: Metadata = {
  title: "Giá vé",
};

export default function Page() {
  return <FaresPage />;
}
