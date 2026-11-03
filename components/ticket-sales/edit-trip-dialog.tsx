"use client";

import { useEffect, useMemo, useState } from "react";
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
  MultiSearchableSelect,
  SearchableSelect,
  type SearchableSelectItem,
} from "@/components/ui/searchable-select";
import { Textarea } from "@/components/ui/textarea";
import type { SeatMap } from "@/types/seat-maps";
import { listSeatMaps } from "@/service/seat-maps";
import type { Staff } from "@/types/staff";
import { listStaff } from "@/service/staff";
import { toast } from "@/lib/toast";
import type { Vehicle } from "@/types/vehicles";
import { listVehicles } from "@/service/vehicles";
import type { Trip, TripCrewMember, TripTicket } from "@/types/trips";
import { formatTripTime } from "@/lib/trips";
import {
  assignTripCrew,
  assignTripVehicle,
  listTripTickets,
  updateTrip,
} from "@/service/trips";

type Form = {
  vehicle_plate: string;
  seat_map_uuid: string;
  departure_time: string;
  driver_name: TripCrewMember[];
  assistant_name: TripCrewMember[];
  note: string;
};

function toForm(trip: Trip): Form {
  return {
    vehicle_plate: trip.vehicle_plate ?? "",
    seat_map_uuid: trip.seat_map_uuid,
    departure_time: formatTripTime(trip.departure_time),
    driver_name: trip.driver_name ?? "",
    assistant_name: trip.assistant_name ?? "",
    note: trip.note ?? "",
  };
}

function crewItems(
  staff: Staff[],
  role: Staff["staff_role"],
  current: TripCrewMember[],
) {
  const items: SearchableSelectItem[] = staff
    .filter((item) => item.staff_role === role && item.status)
    .map((item) => ({
      value: item.id,
      label: item.full_name,
      description: item.phone,
    }));
  current.forEach((member, index) => {
    const value = member.id ?? `legacy:${index}`;
    if (!items.some((item) => item.value === value)) {
      items.push({
        value,
        label: member.full_name,
        description: member.phone || undefined,
      });
    }
  });
  return items;
}

function crewSelection(members: TripCrewMember[]) {
  return members.map((member, index) => member.id ?? `legacy:${index}`);
}

function selectedCrew(
  selectedIds: string[],
  staff: Staff[],
  role: Staff["staff_role"],
  current: TripCrewMember[],
) {
  return selectedIds.flatMap((id) => {
    if (id.startsWith("legacy:")) {
      const member = current[Number(id.slice("legacy:".length))];
      return member ? [member] : [];
    }
    const account = staff.find(
      (item) => item.id === id && item.staff_role === role,
    );
    if (account) {
      return [{ id: account.id, full_name: account.full_name, phone: account.phone }];
    }
    const existing = current.find((member) => member.id === id);
    return existing ? [existing] : [];
  });
}

function sameCrew(left: TripCrewMember[], right: TripCrewMember[]) {
  return left.length === right.length && left.every((member, index) => {
    const other = right[index];
    return member.id === other.id &&
      member.full_name === other.full_name &&
      member.phone === other.phone;
  });
}

const TIME_SELECT_CLASS =
  "h-8 w-16 rounded-lg border border-input bg-transparent px-2 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
const MINUTES = Array.from({ length: 60 }, (_, i) =>
  String(i).padStart(2, "0"),
);

function TimeSelect24({
  id,
  value,
  onChange,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const [hour = "", minute = ""] = value.split(":");

  return (
    <div className="flex items-center gap-1 ">
      <select
        id={id}
        aria-label="Giờ"
        value={hour}
        onChange={(event) => onChange(`${event.target.value}:${minute || "00"}`)}
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
        aria-label="Phút"
        value={minute}
        onChange={(event) => onChange(`${hour || "00"}:${event.target.value}`)}
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
  );
}

export function EditTripDialog({
  trip,
  open,
  onOpenChange,
  onSaved,
}: {
  trip: Trip;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: (trip: Trip, tickets: TripTicket[] | null) => void;
}) {
  const [form, setForm] = useState<Form>(() => toForm(trip));
  const [seatMaps, setSeatMaps] = useState<SeatMap[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }
    setForm(toForm(trip));

    let cancelled = false;
    Promise.all([
      listSeatMaps(trip.company_uuid),
      listStaff(trip.company_uuid),
      listVehicles(trip.company_uuid),
    ])
      .then(([maps, accounts, fleet]) => {
        if (!cancelled) {
          setSeatMaps(maps);
          setStaff(accounts);
          setVehicles(fleet);
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          toast.fromError(error, "Không tải được danh sách sơ đồ ghế, xe, nhân sự.");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [open, trip]);

  const seatMapItems = useMemo(() => {
    const items: SearchableSelectItem[] = seatMaps
      .filter((item) => item.status || item.id === trip.seat_map_uuid)
      .map((item) => ({
        value: item.id,
        label: item.name,
        description: item.seat_map_code,
      }));
    if (!items.some((item) => item.value === trip.seat_map_uuid)) {
      items.push({ value: trip.seat_map_uuid, label: trip.seat_map.name });
    }
    return items;
  }, [seatMaps, trip.seat_map_uuid, trip.seat_map.name]);

  const vehicleItems = useMemo(() => {
    const items: SearchableSelectItem[] = vehicles
      .filter(
        (item) =>
          item.status === "IN_USE" || item.license_plate === trip.vehicle_plate,
      )
      .map((item) => ({
        value: item.license_plate,
        label: item.license_plate,
      }));
    if (
      trip.vehicle_plate &&
      !items.some((item) => item.value === trip.vehicle_plate)
    ) {
      items.push({ value: trip.vehicle_plate, label: trip.vehicle_plate });
    }
    return items;
  }, [vehicles, trip.vehicle_plate]);

  const driverItems = useMemo(
    () => crewItems(staff, "DRIVER", form.driver_name),
    [staff, form.driver_name],
  );
  const assistantItems = useMemo(
    () => crewItems(staff, "ASSISTANT", form.assistant_name),
    [staff, form.assistant_name],
  );

  function setField<K extends keyof Form>(key: K, value: Form[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const initial = toForm(trip);
    const plate = form.vehicle_plate.trim();
    if (!form.departure_time) {
      toast.warning("Vui lòng nhập giờ khởi hành.");
      return;
    }

    const seatMapChanged = form.seat_map_uuid !== initial.seat_map_uuid;
    const generalChanged =
      seatMapChanged ||
      form.departure_time !== initial.departure_time ||
      form.note.trim() !== initial.note;
    const vehicleChanged = plate !== initial.vehicle_plate && plate !== "";
    const crewChanged =
      !sameCrew(form.driver_name, initial.driver_name) ||
      !sameCrew(form.assistant_name, initial.assistant_name);

    setPending(true);
    try {
      let next = trip;
      if (generalChanged) {
        next = await updateTrip(trip.id, {
          departure_time: form.departure_time,
          seat_map_uuid: form.seat_map_uuid,
          note: form.note.trim(),
        });
      }
      if (vehicleChanged) {
        next = await assignTripVehicle(trip.id, plate);
      }
      if (crewChanged) {
        next = await assignTripCrew(trip.id, {
          driver_name: form.driver_name,
          assistant_name: form.assistant_name,
        });
      }
      const tickets = seatMapChanged
        ? (await listTripTickets(trip.id)).tickets
        : null;
      onSaved(next, tickets);
      onOpenChange(false);
      toast.success("Đã cập nhật thông tin chuyến.");
    } catch (error: unknown) {
      toast.fromError(error, "Không lưu được thông tin chuyến.");
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Điều chỉnh thông tin chuyến</DialogTitle>
          <DialogDescription>
            {trip.route.origin} → {trip.route.destination}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid gap-4">
          <FieldGroup className="gap-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="trip-vehicle-plate">Biển số xe</FieldLabel>
                <SearchableSelect
                  id="trip-vehicle-plate"
                  value={form.vehicle_plate}
                  items={vehicleItems}
                  onValueChange={(value) => setField("vehicle_plate", value)}
                  placeholder="Chọn biển số xe"
                  searchPlaceholder="Tìm biển số..."
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="trip-departure-time">
                  Giờ khởi hành
                </FieldLabel>
                <TimeSelect24
                  id="trip-departure-time"
                  value={form.departure_time}
                  onChange={(value) => setField("departure_time", value)}
                />
              </Field>
            </div>
            <Field>
              <FieldLabel htmlFor="trip-seat-map">Sơ đồ ghế</FieldLabel>
              <SearchableSelect
                id="trip-seat-map"
                value={form.seat_map_uuid}
                items={seatMapItems}
                onValueChange={(value) => setField("seat_map_uuid", value)}
                placeholder="Chọn sơ đồ ghế"
                searchPlaceholder="Tìm sơ đồ ghế..."
              />
            </Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="trip-driver">Tài xế</FieldLabel>
                <MultiSearchableSelect
                  id="trip-driver"
                  value={crewSelection(form.driver_name)}
                  items={driverItems}
                  onValueChange={(value) =>
                    setField(
                      "driver_name",
                      selectedCrew(value, staff, "DRIVER", form.driver_name),
                    )
                  }
                  placeholder="Chọn tài xế"
                  searchPlaceholder="Tìm tài xế..."
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="trip-assistant">Phụ xe</FieldLabel>
                <MultiSearchableSelect
                  id="trip-assistant"
                  value={crewSelection(form.assistant_name)}
                  items={assistantItems}
                  onValueChange={(value) =>
                    setField(
                      "assistant_name",
                      selectedCrew(value, staff, "ASSISTANT", form.assistant_name),
                    )
                  }
                  placeholder="Chọn phụ xe"
                  searchPlaceholder="Tìm phụ xe..."
                />
              </Field>
            </div>
            <Field>
              <FieldLabel htmlFor="trip-note">Ghi chú</FieldLabel>
              <Textarea
                id="trip-note"
                value={form.note}
                onChange={(event) => setField("note", event.target.value)}
              />
            </Field>
          </FieldGroup>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={pending}
              onClick={() => onOpenChange(false)}
            >
              Hủy bỏ
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Đang lưu..." : "Lưu"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
