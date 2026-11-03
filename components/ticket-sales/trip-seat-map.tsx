"use client";

import { useMemo, useState } from "react";
import { EditTicketDialog } from "@/components/ticket-sales/edit-ticket-dialog";
import { SelectedTicketsBar } from "@/components/ticket-sales/selected-tickets-bar";
import { toast } from "@/lib/toast";
import type { TripTicket } from "@/types/trips";
import { isOccupiedTicket } from "@/lib/trips";

function ticketKey(ticket: Pick<TripTicket, "row" | "col">) {
  return `${ticket.row}-${ticket.col}`;
}

function layoutSize(tickets: TripTicket[]) {
  let rows = 0;
  let columns = 0;
  for (const ticket of tickets) {
    rows = Math.max(rows, ticket.row);
    columns = Math.max(columns, ticket.col);
  }
  return { rows, columns };
}

function SeatItem({
  ticket,
  selected,
  onToggle,
}: {
  ticket: TripTicket;
  selected: boolean;
  onToggle: () => void;
}) {
  const booked = isOccupiedTicket(ticket.status);
  const phone = ticket.customer_phone?.trim() ?? "";
  const name = ticket.customer_name?.trim() ?? "";
  const pickup = ticket.pickup_name?.trim() ?? "";
  const dropoff = ticket.dropoff_name?.trim() ?? "";

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={selected}
      title={`${ticket.seat_code}${booked ? " · đã đặt" : " · còn trống"}`}
      className={`flex min-h-20 min-w-0 flex-1 flex-col gap-0.5 rounded-md border bg-white px-2.5 py-2 text-left outline-none ${
        selected
          ? "border-primary ring-2 ring-primary/20"
          : booked
            ? "border-red-400"
            : "border-input"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-1.5">
          <span
            className={`truncate text-sm font-semibold ${
              booked ? "text-red-600" : "text-foreground"
            }`}
          >
            {ticket.seat_code}
          </span>
        </div>
        <p
          className={`truncate text-xs ${
            booked ? "text-red-600" : "text-foreground"
          }`}
        >
          {phone || "\u00a0"}
        </p>
      </div>
      <p className="truncate text-xs font-medium">{name || "\u00a0"}</p>
      <p className="truncate text-xs text-muted-foreground">
        {pickup || "\u00a0"}
      </p>
      <p className="truncate text-xs text-muted-foreground">
        {dropoff || "\u00a0"}
      </p>
    </button>
  );
}

function FloorMap({
  floor,
  tickets,
  selectedIds,
  onToggle,
}: {
  floor: number;
  tickets: TripTicket[];
  selectedIds: Set<string>;
  onToggle: (ticketId: string) => void;
}) {
  const cells = tickets.filter((ticket) => ticket.floor === floor);
  const { rows, columns } = layoutSize(cells);
  const byPosition = new Map(
    cells.map((ticket) => [ticketKey(ticket), ticket]),
  );

  if (!rows || !columns) {
    return null;
  }

  return (
    <div className="min-w-0 flex-1">
      <div className="flex flex-col gap-2">
        {Array.from({ length: rows }, (_, rowIndex) => {
          const row = rowIndex + 1;
          return (
            <div
              key={`row-${floor}-${row}`}
              className="flex w-full items-stretch gap-2"
            >
              {Array.from({ length: columns }, (_, colIndex) => {
                const col = colIndex + 1;
                const ticket = byPosition.get(`${row}-${col}`);
                const isSeat = ticket?.cell_type === "seat";

                if (!isSeat || !ticket) {
                  return (
                    <div
                      key={`${floor}-${row}-${col}`}
                      className="min-w-4 flex-1"
                    />
                  );
                }

                return (
                  <SeatItem
                    key={ticket.id}
                    ticket={ticket}
                    selected={selectedIds.has(ticket.id)}
                    onToggle={() => onToggle(ticket.id)}
                  />
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function TripSeatMap({
  tickets,
  selectedIds,
  onSelectedChange,
  onTicketsChange,
  onIssue,
  onMove,
  onCancel,
}: {
  tickets: TripTicket[];
  selectedIds: string[];
  onSelectedChange: (ids: string[]) => void;
  onTicketsChange?: (tickets: TripTicket[]) => void;
  onIssue: () => void;
  onMove: () => void;
  onCancel: () => void;
}) {
  const [editOpen, setEditOpen] = useState(false);
  const floors = [...new Set(tickets.map((ticket) => ticket.floor))].sort(
    (left, right) => left - right,
  );
  const ticketById = useMemo(
    () => new Map(tickets.map((ticket) => [ticket.id, ticket])),
    [tickets],
  );
  const selectedTickets = selectedIds
    .map((id) => ticketById.get(id))
    .filter((ticket): ticket is TripTicket => Boolean(ticket));

  function toggleTicket(ticketId: string) {
    onSelectedChange(
      selectedIds.includes(ticketId)
        ? selectedIds.filter((id) => id !== ticketId)
        : [...selectedIds, ticketId],
    );
  }

  function handleSaved(updated: TripTicket[]) {
    if (!onTicketsChange) {
      return;
    }

    const nextById = new Map(updated.map((ticket) => [ticket.id, ticket]));
    onTicketsChange(
      tickets.map((ticket) => nextById.get(ticket.id) ?? ticket),
    );
  }

  if (!floors.length) {
    return (
      <p className="text-center text-sm text-muted-foreground">
        Chưa có sơ đồ ghế cho chuyến này.
      </p>
    );
  }

  const map =
    floors.length === 1 ? (
      <FloorMap
        floor={floors[0]}
        tickets={tickets}
        selectedIds={new Set(selectedIds)}
        onToggle={toggleTicket}
      />
    ) : (
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {floors.map((floor) => (
          <FloorMap
            key={floor}
            floor={floor}
            tickets={tickets}
            selectedIds={new Set(selectedIds)}
            onToggle={toggleTicket}
          />
        ))}
      </div>
    );

  return (
    <>
      <div className={selectedTickets.length ? "pb-20" : undefined}>{map}</div>
      <SelectedTicketsBar
        tickets={selectedTickets}
        onClear={() => onSelectedChange([])}
        onEdit={() => setEditOpen(true)}
        onIssue={onIssue}
        onMove={onMove}
        onCopy={() => toast.info("Sao chép vé đang được triển khai.")}
        onDelete={onCancel}
      />
      <EditTicketDialog
        tickets={selectedTickets}
        open={editOpen}
        onOpenChange={setEditOpen}
        onSaved={handleSaved}
      />
    </>
  );
}
