import {
  CopyIcon,
  MoveIcon,
  PencilIcon,
  TicketIcon,
  Trash2Icon,
  XIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { TicketStatus, type TripTicket } from "@/types/trips";
import { isAvailableTicket } from "@/lib/trips";

export function SelectedTicketsBar({
  tickets,
  onClear,
  onEdit,
  onIssue,
  onMove,
  onCopy,
  onDelete,
}: {
  tickets: TripTicket[];
  onClear: () => void;
  onEdit: () => void;
  onIssue: () => void;
  onMove: () => void;
  onCopy: () => void;
  onDelete: () => void;
}) {
  if (!tickets.length) {
    return null;
  }

  const canEdit = tickets.every(
    (ticket) =>
      isAvailableTicket(ticket.status) || ticket.status === TicketStatus.BOOKED,
  );
  const canManageBooked = tickets.every(
    (ticket) =>
      ticket.status === TicketStatus.BOOKED ||
      ticket.status === TicketStatus.CONFIRMED,
  );
  const canIssue = tickets.every(
    (ticket) => ticket.status === TicketStatus.BOOKED,
  );

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-3 z-40 flex justify-center px-3">
      <div className="pointer-events-auto flex w-full max-w-4xl overflow-hidden rounded-full border bg-background shadow-lg">
        <div className="flex shrink-0 items-center gap-2 bg-blue-600 px-4 py-2.5 text-white">
          <button
            type="button"
            onClick={onClear}
            aria-label="Bỏ chọn vé"
            className="flex size-6 items-center justify-center rounded-full outline-none hover:bg-white/15"
          >
            <XIcon className="size-4" />
          </button>
          <span className="text-sm font-medium whitespace-nowrap">
            {tickets.length} vé đã chọn
          </span>
        </div>
        <div className="flex min-w-0 flex-1 items-center gap-2 px-3 py-2">
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
            {tickets.map((ticket) => (
              <span
                key={ticket.id}
                className="rounded-full border bg-background px-2.5 py-0.5 text-xs font-medium"
              >
                {ticket.seat_code}
              </span>
            ))}
          </div>
          <div className="flex shrink-0 items-center gap-1">
            {canEdit ? (
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={onEdit}
                aria-label="Chỉnh sửa thông tin vé"
              >
                <PencilIcon />
              </Button>
            ) : null}
            {canManageBooked ? (
              <>
                {canIssue ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={onIssue}
                    aria-label="Xuất vé"
                  >
                    <TicketIcon />
                  </Button>
                ) : null}
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={onMove}
                  aria-label="Di chuyển vé"
                >
                  <MoveIcon />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={onCopy}
                  aria-label="Sao chép vé"
                >
                  <CopyIcon />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={onDelete}
                  aria-label="Xóa vé"
                >
                  <Trash2Icon />
                </Button>
              </>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
