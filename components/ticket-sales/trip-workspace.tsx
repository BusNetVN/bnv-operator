"use client";

import { useEffect, useRef, useState } from "react";
import {
  BanIcon,
  CheckIcon,
  FileTextIcon,
  HistoryIcon,
  PackagePlusIcon,
  PencilIcon,
  PrinterIcon,
  RepeatIcon,
  StickyNoteIcon,
  TicketIcon,
  TruckIcon,
  XIcon,
  XCircleIcon,
} from "lucide-react";
import { EditTripDialog } from "@/components/ticket-sales/edit-trip-dialog";
import {
  ConfirmDialog,
  MoveTicketsDialog,
  TripHistoryDialog,
} from "@/components/ticket-sales/trip-action-dialogs";
import { TripSeatMap } from "@/components/ticket-sales/trip-seat-map";
import {
  TripTicketList,
  ticketsForList,
} from "@/components/ticket-sales/trip-ticket-list";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/lib/toast";
import { TicketStatus, type Trip, type TripStatus, type TripTicket } from "@/types/trips";
import {
  formatTripDate,
  formatTripTime,
  isAvailableTicket,
  mergeTickets,
  tripCrewNames,
  ticketStatusLabel,
} from "@/lib/trips";
import {
  cancelTrip,
  cancelTripTickets,
  issueTripTickets,
  moveTripTickets,
  updateTrip,
} from "@/service/trips";

type TripTab =
  | "seat-map"
  | "e-ticket"
  | "passengers"
  | "pickup"
  | "transfer"
  | "cargo";

type ActionId = (typeof ACTIONS)[number]["id"];

type Confirm = "cancel-tickets" | "cancel-trip" | null;

const ACTIONS = [
  { id: "cancel-trip", label: "Hủy chuyến", icon: XCircleIcon },
] as const;

const TRIP_STATUS_LABEL: Record<TripStatus, string> = {
  SCHEDULED: "Đã lên lịch",
  READY: "Sẵn sàng",
  IN_PROGRESS: "Đang chạy",
  COMPLETED: "Hoàn thành",
};

const TABS: { id: TripTab; label: string }[] = [
  { id: "seat-map", label: "Sơ đồ ghế" },
  { id: "e-ticket", label: "Vé điện tử" },
  { id: "passengers", label: "Hành khách" },
  { id: "pickup", label: "Đón / Trả" },
  { id: "transfer", label: "Trung chuyển" },
];

const TAB_HINT: Record<TripTab, string> = {
  "seat-map": "Sơ đồ ghế của chuyến sẽ hiện tại đây để chọn ghế và bán vé.",
  "e-ticket": "Danh sách vé điện tử đã xuất của chuyến.",
  passengers: "Danh sách hành khách đã đặt chỗ trên chuyến.",
  pickup: "Điểm đón và điểm trả theo vé của chuyến.",
  transfer: "Nghiệp vụ trung chuyển hành khách của chuyến.",
  cargo: "Hàng hóa đi cùng chuyến.",
};

function InfoColumn({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-w-0 space-y-0.5">
      <p className="text-xs text-muted-foreground uppercase">{label}</p>
      {children}
    </div>
  );
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function printPassengerSheet(trip: Trip, tickets: TripTicket[]) {
  const rows = ticketsForList(tickets, "passengers")
    .map(
      (ticket, index) =>
        `<tr><td>${index + 1}</td><td>${escapeHtml(ticket.seat_code)}</td><td>${escapeHtml(ticket.customer_name)}</td><td>${escapeHtml(ticket.customer_phone)}</td><td>${escapeHtml(ticket.pickup_name)}</td><td>${escapeHtml(ticket.dropoff_name)}</td><td>${escapeHtml(ticketStatusLabel(ticket.status))}</td></tr>`,
    )
    .join("");
  const title = `${formatTripTime(trip.departure_time)} ${formatTripDate(trip.trip_date)} - ${trip.route.origin} → ${trip.route.destination}`;
  const driverNames = tripCrewNames(trip.driver_name);
  const assistantNames = tripCrewNames(trip.assistant_name);
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>Phơi ${escapeHtml(title)}</title><style>body{font-family:sans-serif;font-size:13px;padding:16px}table{border-collapse:collapse;width:100%}th,td{border:1px solid #999;padding:4px 6px;text-align:left}</style></head><body><h3>${escapeHtml(title)}</h3><p>Xe: ${escapeHtml(trip.vehicle_plate || "—")} • Tài xế: ${escapeHtml(driverNames || "—")}${assistantNames ? ` • Phụ xe: ${escapeHtml(assistantNames)}` : ""}</p><table><thead><tr><th>#</th><th>Ghế</th><th>Khách</th><th>Điện thoại</th><th>Điểm đón</th><th>Điểm trả</th><th>Trạng thái</th></tr></thead><tbody>${rows}</tbody></table></body></html>`;

  const win = window.open("", "_blank");
  if (!win) {
    toast.warning("Trình duyệt đã chặn cửa sổ in.");
    return;
  }
  win.document.write(html);
  win.document.close();
  win.focus();
  win.print();
}

export function TripWorkspace({
  trip,
  tickets,
  loadingTickets,
  onTicketsChange,
  onTripChange,
}: {
  trip: Trip;
  tickets: TripTicket[];
  loadingTickets: boolean;
  onTicketsChange: (tickets: TripTicket[]) => void;
  onTripChange: (trip: Trip) => void;
}) {
  const [tab, setTab] = useState<TripTab>("seat-map");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [moveOpen, setMoveOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [confirm, setConfirm] = useState<Confirm>(null);
  const [noteEditing, setNoteEditing] = useState(false);
  const [noteDraft, setNoteDraft] = useState(trip.note);
  const noteInputRef = useRef<HTMLTextAreaElement>(null);
  const [pending, setPending] = useState(false);
  const booked = trip.booked_seat_count ?? 0;
  const total = trip.seat_count ?? 0;
  const remaining = Math.max(0, total - booked);
  const cancelled = !trip.status;

  const ticketById = new Map(tickets.map((ticket) => [ticket.id, ticket]));
  const selectedTickets = selectedIds
    .map((id) => ticketById.get(id))
    .filter((ticket): ticket is TripTicket => Boolean(ticket));
  const availableSeats = tickets.filter(
    (ticket) => ticket.cell_type === "seat" && isAvailableTicket(ticket.status),
  );

  useEffect(() => {
    if (!noteEditing) {
      return;
    }
    const input = noteInputRef.current;
    if (!input) {
      return;
    }
    input.focus();
    input.setSelectionRange(input.value.length, input.value.length);
  }, [noteEditing]);

  function selectedWith(statuses: TicketStatus[]) {
    if (cancelled) {
      toast.warning("Chuyến đã bị hủy.");
      return null;
    }
    if (!selectedTickets.length) {
      toast.info("Vui lòng chọn ghế trên sơ đồ ghế.");
      return null;
    }
    if (!selectedTickets.every((ticket) => statuses.includes(ticket.status))) {
      toast.warning("Ghế đã chọn không ở trạng thái phù hợp.");
      return null;
    }
    return selectedTickets;
  }

  async function run(task: () => Promise<void>, fallback: string) {
    setPending(true);
    try {
      await task();
    } catch (error: unknown) {
      toast.fromError(error, fallback);
    } finally {
      setPending(false);
    }
  }

  function applyTickets(changed: TripTicket[]) {
    onTicketsChange(mergeTickets(tickets, changed));
    setSelectedIds([]);
  }

  function handleIssue() {
    const targets = selectedWith([TicketStatus.BOOKED]);
    if (!targets) {
      return;
    }
    void run(async () => {
      const result = await issueTripTickets(
        trip.id,
        targets.map((ticket) => ticket.id),
      );
      applyTickets(result.tickets);
      toast.success(
        "Đã xuất vé.",
        targets.map((ticket) => ticket.seat_code).join(", "),
      );
    }, "Không xuất được vé.");
  }

  function openCancelTickets() {
    if (selectedWith([TicketStatus.BOOKED, TicketStatus.CONFIRMED])) {
      setConfirm("cancel-tickets");
    }
  }

  function openMove() {
    if (selectedWith([TicketStatus.BOOKED, TicketStatus.CONFIRMED])) {
      setMoveOpen(true);
    }
  }

  function handleCancelTickets() {
    void run(async () => {
      const result = await cancelTripTickets(
        trip.id,
        selectedTickets.map((ticket) => ticket.id),
      );
      applyTickets(result.tickets);
      setConfirm(null);
      toast.success("Đã hủy vé.");
    }, "Không hủy được vé.");
  }

  function handleMove(
    moves: { from_ticket_id: string; to_ticket_id: string }[],
  ) {
    void run(async () => {
      const result = await moveTripTickets(trip.id, moves);
      applyTickets(result.tickets);
      setMoveOpen(false);
      toast.success("Đã đổi vé.");
    }, "Không đổi được vé.");
  }

  function handleCancelTrip() {
    void run(async () => {
      const result = await cancelTrip(trip.id);
      onTicketsChange(result.tickets);
      onTripChange(result.trip);
      setSelectedIds([]);
      setConfirm(null);
      toast.success("Đã hủy chuyến.");
    }, "Không hủy được chuyến.");
  }

  function saveNote() {
    void run(async () => {
      const updated = await updateTrip(trip.id, { note: noteDraft.trim() });
      onTripChange(updated);
      setNoteDraft(updated.note);
      setNoteEditing(false);
      toast.success("Đã cập nhật ghi chú.");
    }, "Không lưu được ghi chú.");
  }

  function handleAction(id: ActionId, label: string) {
    switch (id) {

      case "cancel-trip":
        if (cancelled) {
          toast.warning("Chuyến đã bị hủy.");
          return;
        }
        setConfirm("cancel-trip");
        return;
      default:
        toast.info(`${label} đang được triển khai.`);
    }
  }

  return (
    <div className="flex flex-col gap-3 border-t pt-2 mt-1">
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-wrap gap-1">
          {ACTIONS.map((action) => (
            <Button
              key={action.id}
              type="button"
              variant="outline"
              size="default"
              disabled={pending}
              onClick={() => handleAction(action.id, action.label)}
            >
              <action.icon />
              {action.label}
            </Button>
          ))}
        </div>
        <Button
          type="button"
          variant="outline"
          size="icon"
          title="Điều chỉnh thông tin chuyến"
          aria-label="Điều chỉnh thông tin chuyến"
          disabled={pending || cancelled}
          onClick={() => setEditOpen(true)}
        >
          <PencilIcon />
        </Button>
      </div>

      <div className="rounded-lg border bg-background p-3">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="flex flex-wrap items-center gap-1.5 text-sm font-medium">
              <span className="text-base tabular-nums">
                {formatTripTime(trip.departure_time) || "—"} • {formatTripDate(trip.trip_date)}
              </span>
              {cancelled ? (
                <span className="rounded bg-red-500/10 px-1.5 py-0.5 text-xs font-medium text-red-600">
                  Đã hủy
                </span>
              ) : (
                <span className="rounded bg-primary/10 px-1.5 py-0.5 text-xs font-medium text-primary">
                  {TRIP_STATUS_LABEL[trip.trip_status] ?? "—"}
                </span>
              )}
            </p>
            <div className="grid grid-cols-[80px_1fr] gap-y-1">
              <p className="text-sm text-muted-foreground">Biển số:</p>
              <p className="text-sm font-medium">{trip.vehicle_plate || "—"}</p>

              <p className="text-sm text-muted-foreground">Sơ đồ ghế:</p>
              <p className="text-sm font-medium">{trip.seat_map.name || "—"}</p>
            </div>

          </div>




          <div className="grid grid-cols-[80px_1fr] gap-y-1">
            <p className="text-sm text-muted-foreground">Tài xế:</p>
            <p className="text-sm font-medium">
              {tripCrewNames(trip.driver_name) || "—"}
            </p>

            <p className="text-sm text-muted-foreground">Phụ xe:</p>
            <p className="text-sm font-medium">
              {tripCrewNames(trip.assistant_name) || "—"}
            </p>
          </div>

          <div className="grid grid-cols-[80px_1fr] gap-y-1">
            <p className="text-sm text-muted-foreground">Số vé:</p>
            <p className="text-sm font-medium">{trip.booked_seat_count || "0"}</p>

            <p className="text-sm text-muted-foreground">Tiền vé:</p>
            <p className="text-sm font-medium">0</p>

            <p className="text-sm text-muted-foreground">Đã thu:</p>
            <p className="text-sm font-medium">0</p>

            <p className="text-sm text-muted-foreground">Chưa thu:</p>
            <p className="text-sm font-medium">0</p>
          </div>

          <div className="grid grid-cols-[80px_1fr] gap-y-1">
            <p className="text-sm text-muted-foreground">Số hàng:</p>
            <p className="text-sm font-medium">0</p>

            <p className="text-sm text-muted-foreground">Tiền hàng:</p>
            <p className="text-sm font-medium">0</p>

            <p className="text-sm text-muted-foreground">Đã thu:</p>
            <p className="text-sm font-medium">0</p>

            <p className="text-sm text-muted-foreground">Chưa thu:</p>
            <p className="text-sm font-medium">0</p>
          </div>
        </div>
        <div className="mt-3">
          {noteEditing ? (
            <div className="flex max-w-2xl items-start gap-2">
              <StickyNoteIcon className="mt-2 size-4 shrink-0 text-amber-700" />
              <Textarea
                ref={noteInputRef}
                autoFocus
                aria-label="Ghi chú chuyến"
                value={noteDraft}
                disabled={pending || cancelled}
                onChange={(event) => setNoteDraft(event.target.value)}
                className="min-h-16 bg-amber-50"
              />
              <div className="flex shrink-0 gap-1">
                <Button
                  type="button"
                  size="icon-sm"
                  variant="ghost"
                  className="text-green-700 hover:bg-green-100 hover:text-green-800"
                  title="Lưu ghi chú"
                  aria-label="Lưu ghi chú"
                  disabled={pending || cancelled}
                  onClick={saveNote}
                >
                  <CheckIcon />
                </Button>
                <Button
                  type="button"
                  size="icon-sm"
                  variant="ghost"
                  className="text-red-700 hover:bg-red-100 hover:text-red-800"
                  title="Hủy sửa ghi chú"
                  aria-label="Hủy sửa ghi chú"
                  disabled={pending}
                  onClick={() => {
                    setNoteDraft(trip.note);
                    setNoteEditing(false);
                  }}
                >
                  <XIcon />
                </Button>
              </div>
            </div>
          ) : (
            <div className="inline-flex max-w-full items-start gap-2 rounded-md bg-amber-100 px-2 py-1 text-amber-950">
              <StickyNoteIcon className="mt-0.5 size-4 shrink-0 text-amber-700" />
              <p className="min-w-0 whitespace-pre-wrap break-words text-sm font-medium">
                {trip.note || "—"}
              </p>
              <Button
                type="button"
                size="icon-sm"
                variant="ghost"
                title="Sửa ghi chú"
                aria-label="Sửa ghi chú"
                disabled={pending || cancelled}
                className="-my-1 -mr-1 shrink-0 text-amber-800 hover:bg-amber-200 hover:text-amber-950"
                onClick={() => {
                  setNoteDraft(trip.note);
                  setNoteEditing(true);
                }}
              >
                <PencilIcon />
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-1 border-b">
        {TABS.map((item) => {
          const active = tab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={`-mb-px border-b-2 px-2.5 py-1.5 text-sm outline-none ${active
                ? "border-primary font-medium text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
            >
              {item.label}
              {item.id === "passengers" && booked > 0 ? ` (${booked})` : ""}
            </button>
          );
        })}
      </div>

      <div className="min-h-48 rounded-lg border border-dashed bg-background px-4 py-6">
        {tab === "seat-map" ? (
          loadingTickets ? (
            <p className="text-center text-sm text-muted-foreground">
              Đang tải sơ đồ ghế...
            </p>
          ) : tickets.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground">
              {TAB_HINT["seat-map"]}
            </p>
          ) : (
            <TripSeatMap
              key={trip.id}
              tickets={tickets}
              selectedIds={selectedIds}
              onSelectedChange={setSelectedIds}
              onTicketsChange={onTicketsChange}
              onIssue={handleIssue}
              onMove={openMove}
              onCancel={openCancelTickets}
            />
          )
        ) : tab === "e-ticket" ||
          tab === "passengers" ||
          tab === "pickup" ? (
          <TripTicketList tickets={tickets} kind={tab} />
        ) : (
          <p className="text-center text-sm text-muted-foreground">
            {TAB_HINT[tab]}
          </p>
        )}
      </div>

      <EditTripDialog
        open={editOpen}
        trip={trip}
        onOpenChange={setEditOpen}
        onSaved={(next, nextTickets) => {
          onTripChange(next);
          if (nextTickets) {
            onTicketsChange(nextTickets);
            setSelectedIds([]);
          }
        }}
      />
      <TripHistoryDialog
        open={historyOpen}
        tripId={trip.id}
        onOpenChange={setHistoryOpen}
      />
      <MoveTicketsDialog
        open={moveOpen}
        sources={selectedTickets}
        available={availableSeats}
        pending={pending}
        onConfirm={handleMove}
        onOpenChange={setMoveOpen}
      />
      <ConfirmDialog
        open={confirm === "cancel-tickets"}
        title="Hủy vé?"
        description={`Hủy vé ghế ${selectedTickets.map((ticket) => ticket.seat_code).join(", ")} và trả ghế về trạng thái trống.`}
        confirmLabel="Hủy vé"
        destructive
        pending={pending}
        onConfirm={handleCancelTickets}
        onOpenChange={(open) => !open && setConfirm(null)}
      />
      <ConfirmDialog
        open={confirm === "cancel-trip"}
        title="Hủy chuyến?"
        description="Toàn bộ vé đang đặt sẽ bị hủy và chuyến không thể bán thêm. Thao tác này không hoàn tác được."
        confirmLabel="Hủy chuyến"
        destructive
        pending={pending}
        onConfirm={handleCancelTrip}
        onOpenChange={(open) => !open && setConfirm(null)}
      />
    </div>
  );
}
