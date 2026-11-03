import type { Metadata } from "next";
import { TicketSalesPage } from "@/components/ticket-sales/ticket-sales-page";

export const metadata: Metadata = {
  title: "Bán vé",
};

export default function Page() {
  return <TicketSalesPage />;
}
