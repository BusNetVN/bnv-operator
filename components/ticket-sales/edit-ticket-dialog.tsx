"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/lib/toast";
import type { TicketStatusHistory, TripTicket, UpdateTicketInput } from "@/types/trips";
import { ticketStatusLabel } from "@/lib/trips";
import { listTicketHistories, updateTicket } from "@/service/trips";

type DialogTab = "general" | "history";

function sharedText(tickets: TripTicket[], key: keyof TripTicket) {
  const first = String(tickets[0]?.[key] ?? "");
  return tickets.every((ticket) => String(ticket[key] ?? "") === first)
    ? first
    : "";
}

function sharedNumber(tickets: TripTicket[], key: keyof TripTicket) {
  const first = Number(tickets[0]?.[key]) || 0;
  return tickets.every((ticket) => (Number(ticket[key]) || 0) === first)
    ? first
    : 0;
}

function emptyForm(): UpdateTicketInput {
  return {
    customer_name: "",
    customer_phone: "",
    customer_email: "",
    pickup_name: "",
    dropoff_name: "",
    note: "",
    base_price: 0,
    discount_amount: 0,
    final_price: 0,
  };
}

function formatHistoryTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  const hour = String(date.getHours()).padStart(2, "0");
  const minute = String(date.getMinutes()).padStart(2, "0");
  return `${day}/${month}/${year} ${hour}:${minute}`;
}

export function EditTicketDialog({
  tickets,
  open,
  onOpenChange,
  onSaved,
}: {
  tickets: TripTicket[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: (tickets: TripTicket[]) => void;
}) {
  const [tab, setTab] = useState<DialogTab>("general");
  const [form, setForm] = useState<UpdateTicketInput>(emptyForm);
  const [pending, setPending] = useState(false);
  const [histories, setHistories] = useState<TicketStatusHistory[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const seatCodes = tickets.map((ticket) => ticket.seat_code).join(", ");
  const ticketIds = tickets.map((ticket) => ticket.id).join(",");

  useEffect(() => {
    if (!open || !tickets.length) {
      return;
    }

    setTab("general");
    const basePrice = sharedNumber(tickets, "base_price");
    const discountAmount = sharedNumber(tickets, "discount_amount");
    setForm({
      customer_name: sharedText(tickets, "customer_name"),
      customer_phone: sharedText(tickets, "customer_phone"),
      customer_email: sharedText(tickets, "customer_email"),
      pickup_name: sharedText(tickets, "pickup_name"),
      dropoff_name: sharedText(tickets, "dropoff_name"),
      note: sharedText(tickets, "note"),
      base_price: basePrice,
      discount_amount: discountAmount,
      final_price: sharedNumber(tickets, "final_price"),
    });
  }, [open, tickets]);

  useEffect(() => {
    if (!open || tab !== "history" || !tickets.length) {
      return;
    }

    let cancelled = false;
    setLoadingHistory(true);
    Promise.all(tickets.map((ticket) => listTicketHistories(ticket.id)))
      .then((rows) => {
        if (!cancelled) {
          setHistories(
            rows.flat().sort((left, right) => {
              return (
                new Date(right.created_at).getTime() -
                new Date(left.created_at).getTime()
              );
            }),
          );
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setHistories([]);
          toast.fromError(error, "Không tải được lịch sử vé.");
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoadingHistory(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [open, tab, ticketIds, tickets]);

  function updateField<K extends keyof UpdateTicketInput>(
    key: K,
    value: UpdateTicketInput[K],
  ) {
    setForm((current) => {
      const next = { ...current, [key]: value };
      if (key === "base_price" || key === "discount_amount") {
        next.final_price = Math.max(0, next.base_price - next.discount_amount);
      }
      return next;
    });
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    try {
      const updated: TripTicket[] = [];
      for (const ticket of tickets) {
        updated.push(await updateTicket(ticket.id, form));
      }
      onSaved(updated);
      onOpenChange(false);
      toast.success("Đã cập nhật thông tin vé.", seatCodes);
    } catch (error: unknown) {
      toast.fromError(error, "Không lưu được thông tin vé.");
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Chỉnh sửa thông tin vé</DialogTitle>
          <DialogDescription>
            {tickets.length > 1
              ? `Cập nhật cho ${tickets.length} ghế: ${seatCodes}`
              : `Ghế ${seatCodes || "—"}`}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-wrap gap-1 border-b">
          {(
            [
              { id: "general", label: "Thông tin chung" },
              { id: "history", label: "Lịch sử vé" },
            ] as const
          ).map((item) => {
            const active = tab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                className={`-mb-px border-b-2 px-2.5 py-1.5 text-sm outline-none ${
                  active
                    ? "border-primary font-medium text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>

        {tab === "general" ? (
          <form onSubmit={handleSubmit} className="grid gap-4">
            <FieldGroup className="gap-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="ticket-customer-name">
                    Họ tên hành khách
                  </FieldLabel>
                  <Input
                    id="ticket-customer-name"
                    value={form.customer_name}
                    onChange={(event) =>
                      updateField("customer_name", event.target.value)
                    }
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="ticket-customer-phone">
                    Số điện thoại
                  </FieldLabel>
                  <Input
                    id="ticket-customer-phone"
                    value={form.customer_phone}
                    onChange={(event) =>
                      updateField("customer_phone", event.target.value)
                    }
                  />
                </Field>
              </div>
              <Field>
                <FieldLabel htmlFor="ticket-customer-email">Email</FieldLabel>
                <Input
                  id="ticket-customer-email"
                  type="email"
                  value={form.customer_email}
                  onChange={(event) =>
                    updateField("customer_email", event.target.value)
                  }
                />
              </Field>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="ticket-pickup-name">Điểm đón</FieldLabel>
                  <Input
                    id="ticket-pickup-name"
                    value={form.pickup_name}
                    onChange={(event) =>
                      updateField("pickup_name", event.target.value)
                    }
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="ticket-dropoff-name">Điểm trả</FieldLabel>
                  <Input
                    id="ticket-dropoff-name"
                    value={form.dropoff_name}
                    onChange={(event) =>
                      updateField("dropoff_name", event.target.value)
                    }
                  />
                </Field>
              </div>
              <Field>
                <FieldLabel htmlFor="ticket-note">Ghi chú</FieldLabel>
                <Textarea
                  id="ticket-note"
                  value={form.note}
                  onChange={(event) => updateField("note", event.target.value)}
                />
              </Field>
              <div className="grid gap-3 sm:grid-cols-3">
                <Field>
                  <FieldLabel htmlFor="ticket-base-price">Giá vé</FieldLabel>
                  <Input
                    id="ticket-base-price"
                    type="number"
                    min={0}
                    value={form.base_price}
                    onChange={(event) =>
                      updateField("base_price", Number(event.target.value) || 0)
                    }
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="ticket-discount-amount">
                    Giảm giá
                  </FieldLabel>
                  <Input
                    id="ticket-discount-amount"
                    type="number"
                    min={0}
                    value={form.discount_amount}
                    onChange={(event) =>
                      updateField(
                        "discount_amount",
                        Number(event.target.value) || 0,
                      )
                    }
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="ticket-final-price">Tổng tiền</FieldLabel>
                  <Input
                    id="ticket-final-price"
                    type="number"
                    min={0}
                    value={form.final_price}
                    onChange={(event) =>
                      updateField("final_price", Number(event.target.value) || 0)
                    }
                  />
                </Field>
              </div>
            </FieldGroup>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Hủy
              </Button>
              <Button type="submit" disabled={pending || tickets.length === 0}>
                {pending ? "Đang lưu..." : "Lưu"}
              </Button>
            </DialogFooter>
          </form>
        ) : (
          <div className="max-h-80 overflow-auto">
            {loadingHistory ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Đang tải lịch sử vé...
              </p>
            ) : histories.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Chưa có lịch sử cho vé đã chọn.
              </p>
            ) : (
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b text-muted-foreground">
                    <th className="py-2 pr-3 font-medium">Thời gian</th>
                    {tickets.length > 1 ? (
                      <th className="py-2 pr-3 font-medium">Ghế</th>
                    ) : null}
                    <th className="py-2 pr-3 font-medium">Trạng thái</th>
                    <th className="py-2 pr-3 font-medium">Hành khách</th>
                    <th className="py-2 font-medium">Giá</th>
                  </tr>
                </thead>
                <tbody>
                  {histories.map((history) => (
                    <tr key={history.id} className="border-b last:border-0">
                      <td className="py-2 pr-3 whitespace-nowrap">
                        {formatHistoryTime(history.created_at)}
                      </td>
                      {tickets.length > 1 ? (
                        <td className="py-2 pr-3">{history.seat_code}</td>
                      ) : null}
                      <td className="py-2 pr-3">
                        {ticketStatusLabel(history.from_status)} →{" "}
                        {ticketStatusLabel(history.to_status)}
                      </td>
                      <td className="py-2 pr-3">
                        <p>{history.customer_name || "—"}</p>
                        <p className="text-xs text-muted-foreground">
                          {history.customer_phone || "—"}
                        </p>
                      </td>
                      <td className="py-2 tabular-nums">
                        {history.final_price.toLocaleString("vi-VN")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
