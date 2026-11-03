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
import {
  SearchableSelect,
  type SearchableSelectItem,
} from "@/components/ui/searchable-select";
import { listSeatMaps } from "@/service/seat-maps";
import { toast } from "@/lib/toast";
import type { Trip } from "@/types/trips";
import { createTrip } from "@/service/trips";
import type { Route } from "@/types/routes";

const HOURS = Array.from({ length: 24 }, (_, index) =>
  String(index).padStart(2, "0"),
);
const MINUTES = Array.from({ length: 60 }, (_, index) =>
  String(index).padStart(2, "0"),
);
const TIME_SELECT_CLASS =
  "h-8 w-20 rounded-lg border border-input bg-transparent px-2 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

export function CreateReinforcementTripDialog({
  open,
  onOpenChange,
  companyUuid,
  route,
  date,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyUuid: string;
  route: Route;
  date: string;
  onCreated: (trip: Trip) => void;
}) {
  const [seatMapItems, setSeatMapItems] = useState<SearchableSelectItem[]>([]);
  const [seatMapUuid, setSeatMapUuid] = useState("");
  const [departureTime, setDepartureTime] = useState("");
  const [hour = "", minute = ""] = departureTime.split(":");
  const [loadingSeatMaps, setLoadingSeatMaps] = useState(false);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }

    let cancelled = false;
    setDepartureTime("");
    setLoadingSeatMaps(true);
    listSeatMaps(companyUuid)
      .then((seatMaps) => {
        if (cancelled) {
          return;
        }
        const items = seatMaps
          .filter((seatMap) => seatMap.status)
          .map((seatMap) => ({
            value: seatMap.id,
            label: seatMap.name,
            description: seatMap.seat_map_code,
          }));
        setSeatMapItems(items);
        setSeatMapUuid(items[0]?.value ?? "");
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          toast.fromError(error, "Không tải được danh sách sơ đồ ghế.");
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoadingSeatMaps(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [companyUuid, open]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    try {
      const trip = await createTrip({
        route_uuid: route.id,
        seat_map_uuid: seatMapUuid,
        trip_date: date,
        departure_time: departureTime,
      });
      onCreated(trip);
      onOpenChange(false);
      toast.success("Đã tạo chuyến tăng cường.");
    } catch (error: unknown) {
      toast.fromError(error, "Không tạo được chuyến tăng cường.");
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Tăng cường chuyến</DialogTitle>
          <DialogDescription>
            {route.origin} → {route.destination} · {date}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid gap-4">
          <FieldGroup className="gap-3">
            <Field>
              <FieldLabel htmlFor="reinforcement-departure-time">
                Giờ khởi hành
              </FieldLabel>
              <div className="flex items-center gap-1">
                <select
                  id="reinforcement-departure-time"
                  required
                  value={hour}
                  onChange={(event) =>
                    setDepartureTime(`${event.target.value}:${minute}`)
                  }
                  className={TIME_SELECT_CLASS}
                >
                  <option value="" disabled>
                    --
                  </option>
                  {HOURS.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
                <span>:</span>
                <select
                  aria-label="Phút khởi hành"
                  required
                  value={minute}
                  onChange={(event) =>
                    setDepartureTime(`${hour}:${event.target.value}`)
                  }
                  className={TIME_SELECT_CLASS}
                >
                  <option value="" disabled>
                    --
                  </option>
                  {MINUTES.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>
            </Field>
            <Field>
              <FieldLabel htmlFor="reinforcement-seat-map">
                Sơ đồ ghế
              </FieldLabel>
              <SearchableSelect
                id="reinforcement-seat-map"
                value={seatMapUuid}
                items={seatMapItems}
                onValueChange={setSeatMapUuid}
                placeholder={loadingSeatMaps ? "Đang tải sơ đồ ghế..." : "Chọn sơ đồ ghế"}
                searchPlaceholder="Tìm sơ đồ ghế..."
                disabled={loadingSeatMaps || seatMapItems.length === 0}
              />
              {!loadingSeatMaps && seatMapItems.length === 0 ? (
                <p className="text-sm text-destructive">
                  Nhà xe chưa có sơ đồ ghế đang hoạt động.
                </p>
              ) : null}
            </Field>
          </FieldGroup>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={pending}
              onClick={() => onOpenChange(false)}
            >
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={
                pending ||
                loadingSeatMaps ||
                !seatMapUuid ||
                !/^\d{2}:\d{2}$/.test(departureTime)
              }
            >
              {pending ? "Đang tạo..." : "Tạo chuyến"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}