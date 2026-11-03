"use client";

import { useEffect, useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/lib/toast";
import type { TicketStatusHistory, TripTicket } from "@/types/trips";
import { formatDateTime, ticketStatusLabel } from "@/lib/trips";
import { listTripHistories } from "@/service/trips";

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  destructive,
  pending,
  onConfirm,
  onOpenChange,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  destructive?: boolean;
  pending: boolean;
  onConfirm: () => void;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Hủy bỏ</AlertDialogCancel>
          <AlertDialogAction
            variant={destructive ? "destructive" : "default"}
            onClick={onConfirm}
            disabled={pending}
          >
            {pending ? "Đang xử lý..." : confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function MoveTicketsDialog({
  open,
  sources,
  available,
  pending,
  onConfirm,
  onOpenChange,
}: {
  open: boolean;
  sources: TripTicket[];
  available: TripTicket[];
  pending: boolean;
  onConfirm: (moves: { from_ticket_id: string; to_ticket_id: string }[]) => void;
  onOpenChange: (open: boolean) => void;
}) {
  const [targetIds, setTargetIds] = useState<string[]>([]);

  useEffect(() => {
    if (open) {
      setTargetIds([]);
    }
  }, [open]);

  const needed = sources.length;
  const byId = new Map(available.map((ticket) => [ticket.id, ticket]));

  function toggle(id: string) {
    setTargetIds((current) => {
      if (current.includes(id)) {
        return current.filter((item) => item !== id);
      }
      if (current.length >= needed) {
        toast.warning(`Chỉ chọn ${needed} ghế trống để đổi.`);
        return current;
      }
      return [...current, id];
    });
  }

  function handleConfirm() {
    onConfirm(
      sources.map((source, index) => ({
        from_ticket_id: source.id,
        to_ticket_id: targetIds[index],
      })),
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Đổi vé</DialogTitle>
          <DialogDescription>
            Chọn {needed} ghế trống để chuyển thông tin khách từ{" "}
            {sources.map((ticket) => ticket.seat_code).join(", ")}.
          </DialogDescription>
        </DialogHeader>

        {available.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Chuyến không còn ghế trống.
          </p>
        ) : (
          <div className="flex max-h-60 flex-wrap gap-1.5 overflow-y-auto">
            {available.map((ticket) => {
              const index = targetIds.indexOf(ticket.id);
              const active = index >= 0;
              return (
                <button
                  key={ticket.id}
                  type="button"
                  onClick={() => toggle(ticket.id)}
                  aria-pressed={active}
                  className={`rounded-md border px-2.5 py-1 text-sm outline-none ${
                    active
                      ? "border-primary bg-primary/10 font-medium"
                      : "hover:bg-muted"
                  }`}
                >
                  {ticket.seat_code}
                  {active && needed > 1
                    ? ` ← ${sources[index]?.seat_code}`
                    : ""}
                </button>
              );
            })}
          </div>
        )}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Hủy bỏ
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={
              pending ||
              targetIds.length !== needed ||
              targetIds.some((id) => !byId.has(id))
            }
          >
            {pending ? "Đang đổi..." : "Đổi vé"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function TripHistoryDialog({
  open,
  tripId,
  onOpenChange,
}: {
  open: boolean;
  tripId: string;
  onOpenChange: (open: boolean) => void;
}) {
  const [rows, setRows] = useState<TicketStatusHistory[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }

    let cancelled = false;
    setLoading(true);
    listTripHistories(tripId)
      .then((data) => {
        if (!cancelled) {
          setRows(data);
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setRows([]);
          toast.fromError(error, "Không tải được lịch sử chuyến.");
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [open, tripId]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Lịch sử chuyến</DialogTitle>
          <DialogDescription>
            Các thay đổi trạng thái vé của chuyến.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-96 overflow-y-auto">
          {loading ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Đang tải lịch sử...
            </p>
          ) : rows.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Chưa có lịch sử.
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead className="text-left text-xs text-muted-foreground">
                <tr>
                  <th className="py-1.5 pr-3 font-medium">Thời gian</th>
                  <th className="py-1.5 pr-3 font-medium">Ghế</th>
                  <th className="py-1.5 pr-3 font-medium">Trạng thái</th>
                  <th className="py-1.5 font-medium">Khách</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="border-t">
                    <td className="py-1.5 pr-3 whitespace-nowrap tabular-nums">
                      {formatDateTime(row.created_at)}
                    </td>
                    <td className="py-1.5 pr-3 font-medium">{row.seat_code}</td>
                    <td className="py-1.5 pr-3 whitespace-nowrap">
                      {ticketStatusLabel(row.from_status)} →{" "}
                      {ticketStatusLabel(row.to_status)}
                    </td>
                    <td className="py-1.5">
                      {[row.customer_name, row.customer_phone]
                        .filter(Boolean)
                        .join(" • ") || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
