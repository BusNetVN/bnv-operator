"use client";

import { useEffect, useMemo, useState } from "react";
import { PencilIcon, PlusIcon, SearchIcon, Trash2Icon } from "lucide-react";
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
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Field,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { getAccount } from "@/lib/auth-session";
import { listRoutes, type Route } from "@/lib/routes";
import { listSeatMaps, type SeatMap } from "@/lib/seat-maps";
import {
  createSchedule,
  deleteSchedule,
  emptyScheduleInput,
  formatDateRange,
  listSchedules,
  statusLabel,
  toScheduleInput,
  toSchedulePayload,
  updateSchedule,
  weekdaysLabel,
  WEEKDAYS,
  type Schedule,
  type ScheduleInput,
  type WeekdayMode,
} from "@/lib/schedules";
import { toast } from "@/lib/toast";

const SELECT_CLASS =
  "h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

export function SchedulesPage() {
  const [companyUuid, setCompanyUuid] = useState<string | null>(null);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [seatMaps, setSeatMaps] = useState<SeatMap[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Schedule | null>(null);
  const [form, setForm] = useState<ScheduleInput>(emptyScheduleInput);
  const [deleting, setDeleting] = useState<Schedule | null>(null);
  const [pending, setPending] = useState(false);

  async function refresh(companyId: string) {
    const [nextSchedules, nextRoutes, nextSeatMaps] = await Promise.all([
      listSchedules(companyId),
      listRoutes(companyId),
      listSeatMaps(companyId),
    ]);
    setSchedules(nextSchedules);
    setRoutes(nextRoutes);
    setSeatMaps(nextSeatMaps);
  }

  useEffect(() => {
    const account = getAccount();
    const companyId = account?.company_uuid ?? null;
    setCompanyUuid(companyId);

    if (!companyId) {
      setLoading(false);
      toast.warning(
        "Tài khoản chưa gắn với nhà xe.",
        "Chưa khai báo được lịch chạy.",
      );
      return;
    }

    refresh(companyId)
      .catch((error: unknown) => {
        toast.fromError(error, "Không tải được danh sách lịch chạy.");
      })
      .finally(() => setLoading(false));
  }, []);

  const filteredSchedules = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    if (!keyword) {
      return schedules;
    }

    return schedules.filter((item) =>
      [
        item.route.route_code,
        item.route.name,
        item.route.origin,
        item.route.destination,
        item.seat_map.seat_map_code,
        item.seat_map.name,
        weekdaysLabel(item.weekday_mode, item.weekdays),
        item.note,
      ]
        .join(" ")
        .toLowerCase()
        .includes(keyword),
    );
  }, [schedules, query]);

  function updateField<K extends keyof ScheduleInput>(
    key: K,
    value: ScheduleInput[K],
  ) {
    setForm((current) => {
      const next = { ...current, [key]: value };
      if (key === "weekday_mode") {
        next.weekdays =
          value === "all"
            ? WEEKDAYS.map((item) => item.value)
            : current.weekdays.length
              ? current.weekdays
              : WEEKDAYS.map((item) => item.value);
      }
      return next;
    });
  }

  function toggleWeekday(day: number, checked: boolean) {
    setForm((current) => {
      const selected = new Set(current.weekdays);
      if (checked) {
        selected.add(day);
      } else {
        selected.delete(day);
      }
      return {
        ...current,
        weekday_mode: "custom",
        weekdays: [...selected].sort((left, right) => left - right),
      };
    });
  }

  function openCreate() {
    setEditing(null);
    setForm(emptyScheduleInput());
    setFormOpen(true);
  }

  function openEdit(schedule: Schedule) {
    setEditing(schedule);
    setForm(toScheduleInput(schedule));
    setFormOpen(true);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!companyUuid) {
      return;
    }

    const payload = toSchedulePayload(form);
    setPending(true);

    try {
      if (editing) {
        await updateSchedule(editing.id, payload);
        toast.success("Đã cập nhật lịch chạy.");
      } else {
        await createSchedule(companyUuid, payload);
        toast.success("Đã thêm lịch chạy.");
      }
      await refresh(companyUuid);
      setFormOpen(false);
    } catch (error: unknown) {
      toast.fromError(error, "Không lưu được lịch chạy. Vui lòng thử lại.");
    } finally {
      setPending(false);
    }
  }

  async function handleDelete() {
    if (!deleting || !companyUuid) {
      return;
    }

    setPending(true);
    try {
      await deleteSchedule(deleting.id);
      await refresh(companyUuid);
      toast.success("Đã xóa lịch chạy.", deleting.route.name);
      setDeleting(null);
    } catch (error: unknown) {
      toast.fromError(error, "Không xóa được lịch chạy. Vui lòng thử lại.");
      setDeleting(null);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-800">
            Lịch chạy
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Gán sơ đồ ghế cho tuyến theo khoảng ngày và các thứ trong tuần.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative min-w-0 flex-1 max-w-sm">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Tìm tuyến, sơ đồ ghế..."
            className="pl-8"
          />
        </div>
        <Button onClick={openCreate} disabled={!companyUuid}>
          <PlusIcon />
          Thêm lịch chạy
        </Button>
      </div>

      <div className="overflow-hidden rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tuyến</TableHead>
              <TableHead>Sơ đồ ghế</TableHead>
              <TableHead>Thời gian</TableHead>
              <TableHead>Thứ áp dụng</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead className="w-24 text-right">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="h-24 text-center text-muted-foreground"
                >
                  Đang tải danh sách lịch chạy...
                </TableCell>
              </TableRow>
            ) : filteredSchedules.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="h-24 text-center text-muted-foreground"
                >
                  {schedules.length === 0
                    ? "Chưa có lịch chạy nào. Bấm Thêm lịch chạy để khai báo."
                    : "Không tìm thấy lịch chạy phù hợp."}
                </TableCell>
              </TableRow>
            ) : (
              filteredSchedules.map((schedule) => (
                <TableRow key={schedule.id}>
                  <TableCell>
                    <div className="font-medium uppercase">
                      {schedule.route.route_code}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {schedule.route.name}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium uppercase">
                      {schedule.seat_map.seat_map_code}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {schedule.seat_map.name}
                    </div>
                  </TableCell>
                  <TableCell>
                    {formatDateRange(schedule.start_date, schedule.end_date)}
                  </TableCell>
                  <TableCell>
                    {weekdaysLabel(schedule.weekday_mode, schedule.weekdays)}
                  </TableCell>
                  <TableCell
                    className={
                      schedule.status
                        ? "text-emerald-700"
                        : "text-muted-foreground"
                    }
                  >
                    {statusLabel(schedule.status)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => openEdit(schedule)}
                      >
                        <PencilIcon />
                        <span className="sr-only">
                          Sửa lịch {schedule.route.name}
                        </span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => setDeleting(schedule)}
                      >
                        <Trash2Icon />
                        <span className="sr-only">
                          Xóa lịch {schedule.route.name}
                        </span>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <form onSubmit={handleSubmit} className="grid gap-4">
            <DialogHeader>
              <DialogTitle>
                {editing ? "Sửa lịch chạy" : "Thêm lịch chạy"}
              </DialogTitle>
              <DialogDescription>
                Chọn tuyến, sơ đồ ghế, khoảng ngày và các thứ áp dụng trong
                tuần.
              </DialogDescription>
            </DialogHeader>

            <FieldGroup className="gap-4">
              <Field>
                <FieldLabel htmlFor="schedule-route">Tuyến đường</FieldLabel>
                <select
                  id="schedule-route"
                  value={form.route_uuid}
                  onChange={(event) =>
                    updateField("route_uuid", event.target.value)
                  }
                  className={SELECT_CLASS}
                >
                  <option value="">Chọn tuyến đường</option>
                  {routes.map((route) => (
                    <option key={route.id} value={route.id}>
                      {route.name}
                    </option>
                  ))}
                </select>
              </Field>

              <Field>
                <FieldLabel htmlFor="schedule-seat-map">Sơ đồ ghế</FieldLabel>
                <select
                  id="schedule-seat-map"
                  value={form.seat_map_uuid}
                  onChange={(event) =>
                    updateField("seat_map_uuid", event.target.value)
                  }
                  className={SELECT_CLASS}
                >
                  <option value="">Chọn sơ đồ ghế</option>
                  {seatMaps.map((seatMap) => (
                    <option key={seatMap.id} value={seatMap.id}>
                      {seatMap.name}
                    </option>
                  ))}
                </select>
              </Field>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="schedule-start-date">Từ ngày</FieldLabel>
                  <Input
                    id="schedule-start-date"
                    type="date"
                    value={form.start_date}
                    onChange={(event) =>
                      updateField("start_date", event.target.value)
                    }
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="schedule-end-date">Đến ngày</FieldLabel>
                  <Input
                    id="schedule-end-date"
                    type="date"
                    value={form.end_date}
                    onChange={(event) =>
                      updateField("end_date", event.target.value)
                    }
                  />
                </Field>
              </div>

              <Field>
                <FieldLabel htmlFor="schedule-weekday-mode">
                  Áp dụng trong tuần
                </FieldLabel>
                <select
                  id="schedule-weekday-mode"
                  value={form.weekday_mode}
                  onChange={(event) =>
                    updateField(
                      "weekday_mode",
                      event.target.value as WeekdayMode,
                    )
                  }
                  className={SELECT_CLASS}
                >
                  <option value="all">Tất cả các thứ</option>
                  <option value="custom">Chọn thứ cụ thể</option>
                </select>
              </Field>

              {form.weekday_mode === "custom" ? (
                <Field>
                  <FieldLabel>Các thứ áp dụng</FieldLabel>
                  <div className="flex flex-wrap gap-3">
                    {WEEKDAYS.map((item) => {
                      const checked = form.weekdays.includes(item.value);
                      return (
                        <label
                          key={item.value}
                          className="flex items-center gap-2 text-sm"
                        >
                          <Checkbox
                            checked={checked}
                            onCheckedChange={(value) =>
                              toggleWeekday(item.value, value === true)
                            }
                          />
                          {item.label}
                        </label>
                      );
                    })}
                  </div>
                </Field>
              ) : null}

              <Field>
                <FieldLabel htmlFor="schedule-note">Ghi chú</FieldLabel>
                <Textarea
                  id="schedule-note"
                  value={form.note}
                  onChange={(event) => updateField("note", event.target.value)}
                  placeholder="Ghi chú nội bộ về lịch chạy..."
                />
              </Field>

              <Field orientation="horizontal" className="items-center gap-2">
                <Checkbox
                  id="schedule-status"
                  checked={form.status}
                  onCheckedChange={(checked) =>
                    updateField("status", checked === true)
                  }
                />
                <FieldLabel htmlFor="schedule-status" className="font-normal">
                  Đang hoạt động
                </FieldLabel>
              </Field>
            </FieldGroup>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setFormOpen(false)}
              >
                Hủy
              </Button>
              <Button type="submit" disabled={pending}>
                {pending ? "Đang lưu..." : editing ? "Cập nhật" : "Thêm mới"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => {
          if (!open) {
            setDeleting(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa lịch chạy?</AlertDialogTitle>
            <AlertDialogDescription>
              Lịch chạy tuyến {deleting?.route.name} sẽ bị xóa khỏi hệ thống.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => void handleDelete()}
              disabled={pending}
            >
              {pending ? "Đang xóa..." : "Xóa"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
