import { TicketStatus, type TripTicket } from "@/types/trips";
import { isOccupiedTicket, ticketStatusLabel } from "@/lib/trips";

export type TicketListKind = "e-ticket" | "passengers" | "pickup";

const ISSUED = new Set<string>([
  TicketStatus.CONFIRMED,
  TicketStatus.CHECKED_IN,
  TicketStatus.COMPLETED,
]);

export function ticketsForList(tickets: TripTicket[], kind: TicketListKind) {
  const seats = tickets.filter(
    (ticket) => ticket.cell_type === "seat" && isOccupiedTicket(ticket.status),
  );
  const rows =
    kind === "e-ticket"
      ? seats.filter((ticket) => ISSUED.has(ticket.status))
      : seats;

  if (kind === "pickup") {
    return [...rows].sort((left, right) => {
      if (!left.pickup_name !== !right.pickup_name) {
        return left.pickup_name ? -1 : 1;
      }
      return left.pickup_name.localeCompare(right.pickup_name, "vi");
    });
  }
  return rows;
}

function money(value: number) {
  return `${value.toLocaleString("vi-VN")}đ`;
}

export function TripTicketList({
  tickets,
  kind,
}: {
  tickets: TripTicket[];
  kind: TicketListKind;
}) {
  const rows = ticketsForList(tickets, kind);

  if (rows.length === 0) {
    return (
      <p className="text-center text-sm text-muted-foreground">
        {kind === "e-ticket"
          ? "Chưa có vé điện tử nào được xuất."
          : "Chưa có hành khách trên chuyến."}
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="text-left text-xs text-muted-foreground">
          <tr>
            <th className="py-1.5 pr-3 font-medium">Ghế</th>
            <th className="py-1.5 pr-3 font-medium">Khách</th>
            <th className="py-1.5 pr-3 font-medium">Điện thoại</th>
            <th className="py-1.5 pr-3 font-medium">Điểm đón</th>
            <th className="py-1.5 pr-3 font-medium">Điểm trả</th>
            {kind === "pickup" ? null : (
              <>
                <th className="py-1.5 pr-3 font-medium">Giá</th>
                <th className="py-1.5 font-medium">Trạng thái</th>
              </>
            )}
          </tr>
        </thead>
        <tbody>
          {rows.map((ticket) => (
            <tr key={ticket.id} className="border-t">
              <td className="py-1.5 pr-3 font-medium">{ticket.seat_code}</td>
              <td className="py-1.5 pr-3">{ticket.customer_name || "—"}</td>
              <td className="py-1.5 pr-3 tabular-nums">
                {ticket.customer_phone || "—"}
              </td>
              <td className="py-1.5 pr-3">{ticket.pickup_name || "—"}</td>
              <td className="py-1.5 pr-3">{ticket.dropoff_name || "—"}</td>
              {kind === "pickup" ? null : (
                <>
                  <td className="py-1.5 pr-3 tabular-nums">
                    {money(ticket.final_price)}
                  </td>
                  <td className="py-1.5">{ticketStatusLabel(ticket.status)}</td>
                </>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
