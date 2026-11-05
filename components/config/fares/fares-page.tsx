"use client";

import { useEffect, useMemo, useState } from "react";
import { PencilIcon, PlusIcon, Trash2Icon } from "lucide-react";
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
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { SearchableSelect } from "@/components/ui/searchable-select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useHasPermission } from "@/features/permission/hooks/use-has-permission";
import { useAuthStore } from "@/features/auth/stores/auth.store";
import type { Fare, FareInput } from "@/types/fares";
import {
  emptyFareInput,
  emptyFareSegment,
  formatFarePrice,
  ALL_WEEKDAYS,
  formatWeekdays,
  toFareInput,
  WEEKDAYS,
} from "@/lib/fares";
import { createFare, deleteFare, listFares, updateFare } from "@/service/fares";
import { PointTreeSelect, type FareStopPoint } from "@/components/config/fares/point-tree-select";
import type { RouteStop } from "@/types/route-stops";
import { listRouteStops } from "@/service/route-stops";
import type { Route } from "@/types/routes";
import { itineraryLabel } from "@/lib/routes";
import { listRoutes } from "@/service/routes";
import type { SeatMap } from "@/types/seat-maps";
import { listSeatMaps } from "@/service/seat-maps";
import type { Schedule } from "@/types/schedules";
import { formatDate, formatDateRange, formatDepartureTime } from "@/lib/schedules";
import { listSchedules } from "@/service/schedules";
import { toast } from "@/lib/toast";

type FormErrors = Partial<
  Record<
    "route_uuid" | "start_date" | "end_date" | "weekdays" | "segments",
    string
  >
>;

export function FaresPage() {
  const [companyUuid, setCompanyUuid] = useState<string | null>(null);
  const canManage = useHasPermission("FARE_CREATE", "FARE_UPDATE");
  const [routes, setRoutes] = useState<Route[]>([]);
  const [fares, setFares] = useState<Fare[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [seatMaps, setSeatMaps] = useState<SeatMap[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Fare | null>(null);
  const [form, setForm] = useState<FareInput>(emptyFareInput());
  const [errors, setErrors] = useState<FormErrors>({});
  const [stops, setStops] = useState<RouteStop[]>([]);
  const [stopsLoading, setStopsLoading] = useState(false);
  const [pending, setPending] = useState(false);
  const [deleting, setDeleting] = useState<Fare | null>(null);

  async function refresh(companyId: string) {
    const [nextRoutes, nextFares, nextSchedules, nextSeatMaps] =
      await Promise.all([
        listRoutes(companyId),
        listFares(companyId),
        listSchedules(companyId),
        listSeatMaps(companyId),
      ]);
    setRoutes(nextRoutes);
    setFares(nextFares);
    setSchedules(nextSchedules);
    setSeatMaps(nextSeatMaps);
  }

  useEffect(() => {
    const account = useAuthStore.getState().account;
    const companyId = account?.company_uuid ?? null;
    setCompanyUuid(companyId);

    if (!companyId) {
      setLoading(false);
      toast.warning(
        "Tài khoản chưa gắn với nhà xe.",
        "Chưa cấu hình được giá vé.",
      );
      return;
    }

    refresh(companyId)
      .catch((error: unknown) => {
        toast.fromError(error, "Không tải được cấu hình giá vé.");
      })
      .finally(() => setLoading(false));
  }, []);

  const faresByRoute = useMemo(() => {
    const grouped = new Map<string, Fare[]>();
    for (const fare of fares) {
      const current = grouped.get(fare.route_uuid) ?? [];
      current.push(fare);
      grouped.set(fare.route_uuid, current);
    }
    return grouped;
  }, [fares]);

  const scheduleItems = useMemo(
    () => [
      { value: "", label: "Tất cả chuyến" },
      ...schedules
        .filter((schedule) => schedule.route_uuid === form.route_uuid)
        .map((schedule) => ({
          value: schedule.id,
          label: `${formatDepartureTime(schedule.departure_time)} · ${schedule.seat_map.name}`,
          description: formatDateRange(schedule.start_date, schedule.end_date),
        })),
    ],
    [form.route_uuid, schedules],
  );

  const seatMapItems = useMemo(
    () => [
      { value: "", label: "Tất cả sơ đồ ghế" },
      ...seatMaps
        .filter((seatMap) => seatMap.status)
        .map((seatMap) => ({
          value: seatMap.id,
          label: seatMap.name,
          description: seatMap.seat_map_code,
        })),
    ],
    [seatMaps],
  );

  async function loadStops(routeId: string) {
    setStopsLoading(true);
    try {
      setStops(await listRouteStops(routeId));
    } catch (error: unknown) {
      setStops([]);
      toast.fromError(error, "Không tải được điểm dừng của tuyến.");
    } finally {
      setStopsLoading(false);
    }
  }

  function openCreate(route: Route) {
    setEditing(null);
    setErrors({});
    setStops([]);
    setForm(emptyFareInput(route.id));
    setFormOpen(true);
    void loadStops(route.id);
  }

  function openEdit(fare: Fare) {
    setEditing(fare);
    setErrors({});
    setStops([]);
    setForm(toFareInput(fare));
    setFormOpen(true);
    void loadStops(fare.route_uuid);
  }

  function changeRoute(routeId: string) {
    setForm((current) => ({
      ...current,
      route_uuid: routeId,
      schedule_uuid: "",
      segments: [],
    }));
    setStops([]);
    void loadStops(routeId);
  }

  function toggleWeekday(day: number) {
    setForm((current) => {
      const selected = current.weekdays.includes(day)
        ? current.weekdays.filter((value) => value !== day)
        : [...current.weekdays, day];
      return {
        ...current,
        weekdays: selected.sort((left, right) => left - right),
      };
    });
  }

  const stopPoints = useMemo<FareStopPoint[]>(
    () =>
      stops.map((stop) => ({
        id: stop.point.id,
        name: stop.point.name,
        provinceName: stop.point.province_name ?? "",
        wardName: stop.point.ward_name ?? "",
        sortOrder: stop.sort_order,
      })),
    [stops],
  );

  function addSegment() {
    setForm((current) => ({
      ...current,
      segments: [...current.segments, emptyFareSegment()],
    }));
  }

  function removeSegment(index: number) {
    setForm((current) => ({
      ...current,
      segments: current.segments.filter((_, segmentIndex) => segmentIndex !== index),
    }));
  }

  function updateSegmentPoints(
    index: number,
    side: "origin" | "destination",
    pointIds: string[],
  ) {
    setForm((current) => ({
      ...current,
      segments: current.segments.map((segment, segmentIndex) => {
        if (segmentIndex !== index) {
          return segment;
        }
        const previous = side === "origin" ? segment.origins : segment.destinations;
        const names = new Map(previous.map((point) => [point.id, point.name]));
        for (const stop of stops) {
          names.set(stop.point.id, stop.point.name);
        }
        const next = pointIds.map((id) => ({ id, name: names.get(id) ?? "" }));
        if (side === "origin") {
          return { ...segment, origins: next };
        }
        return { ...segment, destinations: next };
      }),
    }));
  }

  function updateSegmentPrice(index: number, price: string) {
    setForm((current) => ({
      ...current,
      segments: current.segments.map((segment, segmentIndex) =>
        segmentIndex === index
          ? { ...segment, price: price.replace(/[^\d]/g, "") }
          : segment,
      ),
    }));
  }

  function validate(values: FareInput) {
    const nextErrors: FormErrors = {};
    if (!values.route_uuid) {
      nextErrors.route_uuid = "Vui lòng chọn tuyến đường.";
    }
    if (!values.start_date) {
      nextErrors.start_date = "Vui lòng chọn ngày bắt đầu.";
    }
    if (!values.end_date) {
      nextErrors.end_date = "Vui lòng chọn ngày kết thúc.";
    }
    if (
      values.start_date &&
      values.end_date &&
      values.start_date > values.end_date
    ) {
      nextErrors.end_date = "Ngày kết thúc phải sau ngày bắt đầu.";
    }
    if (values.weekdays.length === 0) {
      nextErrors.weekdays = "Chọn ít nhất một thứ trong tuần.";
    }
    if (stops.length < 2) {
      nextErrors.segments = "Tuyến cần ít nhất hai điểm dừng để thêm chặng.";
    } else if (values.segments.length === 0) {
      nextErrors.segments = "Thêm ít nhất một chặng.";
    } else {
      const order = new Map(stops.map((stop) => [stop.point.id, stop.sort_order]));
      const seen = new Set<string>();
      for (const segment of values.segments) {
        if (segment.origins.length === 0 || segment.destinations.length === 0) {
          nextErrors.segments = "Chọn nơi đi và nơi đến cho từng chặng.";
          break;
        }
        if (segment.price.trim() === "") {
          nextErrors.segments = "Vui lòng nhập giá cho tất cả các chặng.";
          break;
        }
        let rowFailed = false;
        for (const origin of segment.origins) {
          for (const destination of segment.destinations) {
            const originOrder = order.get(origin.id);
            const destinationOrder = order.get(destination.id);
            if (
              originOrder === undefined ||
              destinationOrder === undefined ||
              originOrder >= destinationOrder
            ) {
              nextErrors.segments = "Nơi đến phải nằm sau nơi đi trên tuyến.";
              rowFailed = true;
              break;
            }
            const key = `${origin.id}:${destination.id}`;
            if (seen.has(key)) {
              nextErrors.segments = "Có chặng bị trùng.";
              rowFailed = true;
              break;
            }
            seen.add(key);
          }
          if (rowFailed) {
            break;
          }
        }
        if (rowFailed) {
          break;
        }
      }
    }
    return nextErrors;
  }

  async function handleSave() {
    if (!companyUuid || !canManage) {
      return;
    }
    const nextErrors = validate(form);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setPending(true);
    try {
      if (editing) {
        await updateFare(editing.id, form);
        toast.success("Đã cập nhật cấu hình giá vé.");
      } else {
        await createFare(companyUuid, form);
        toast.success("Đã thêm cấu hình giá vé.");
      }
      await refresh(companyUuid);
      setFormOpen(false);
    } catch (error: unknown) {
      toast.fromError(error, "Không lưu được cấu hình giá vé.");
    } finally {
      setPending(false);
    }
  }

  async function handleDelete() {
    if (!deleting || !companyUuid || !canManage) {
      return;
    }
    setPending(true);
    try {
      await deleteFare(deleting.id);
      await refresh(companyUuid);
      toast.success("Đã xóa cấu hình giá vé.");
      setDeleting(null);
    } catch (error: unknown) {
      toast.fromError(error, "Không xóa được cấu hình giá vé.");
      setDeleting(null);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-800">
          Giá vé
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Mỗi tuyến có thể có nhiều cấu hình giá theo chuyến, sơ đồ ghế và
          khoảng ngày.
        </p>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Đang tải tuyến và giá vé...</p>
      ) : routes.length === 0 ? (
        <div className="rounded-xl border bg-card px-4 py-16 text-center text-sm text-muted-foreground">
          Chưa có tuyến đường. Hãy khai báo tuyến trước khi cấu hình giá.
        </div>
      ) : (
        routes.map((route) => {
          const routeFares = faresByRoute.get(route.id) ?? [];
          return (
            <section
              key={route.id}
              className="overflow-hidden rounded-xl border bg-card"
            >
              <div className="flex flex-col gap-3 border-b px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <h2 className="truncate font-medium">
                    {route.route_code} · {route.name}
                  </h2>
                  <p className="truncate text-sm text-muted-foreground">
                    {itineraryLabel(route)}
                  </p>
                </div>
                <Button
                  onClick={() => void openCreate(route)}
                  disabled={!canManage || !companyUuid}
                >
                  <PlusIcon />
                  Thêm cấu hình giá
                </Button>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Thời gian</TableHead>
                    <TableHead>Chuyến</TableHead>
                    <TableHead>Sơ đồ ghế</TableHead>
                    <TableHead>Chặng</TableHead>
                    <TableHead className="w-24 text-right">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {routeFares.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="h-16 text-center text-muted-foreground"
                      >
                        Chưa có cấu hình giá vé.
                      </TableCell>
                    </TableRow>
                  ) : (
                    routeFares.map((fare) => (
                      <TableRow
                        key={fare.id}
                        className={
                          fare.priority ? "bg-amber-50 hover:bg-amber-100" : undefined
                        }
                      >
                        <TableCell>
                          <div>
                            {formatDate(fare.start_date)} → {formatDate(fare.end_date)}
                          </div>
                          <div className="text-muted-foreground">
                            {formatWeekdays(
                              fare.weekdays?.length ? fare.weekdays : [...ALL_WEEKDAYS],
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {fare.schedule
                            ? formatDepartureTime(fare.schedule.departure_time)
                            : "Tất cả chuyến"}
                        </TableCell>
                        <TableCell>
                          {fare.seat_map?.name ?? "Tất cả sơ đồ ghế"}
                        </TableCell>
                        <TableCell>
                          {fare.segments.length} chặng
                          {fare.segments.length > 0
                            ? ` · từ ${formatFarePrice(
                                Math.min(
                                  ...fare.segments.map((segment) => segment.price),
                                ),
                              )}`
                            : ""}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              disabled={!canManage}
                              onClick={() => void openEdit(fare)}
                            >
                              <PencilIcon />
                              <span className="sr-only">Sửa cấu hình giá</span>
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              disabled={!canManage}
                              onClick={() => setDeleting(fare)}
                            >
                              <Trash2Icon />
                              <span className="sr-only">Xóa cấu hình giá</span>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </section>
          );
        })
      )}

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              {editing ? "Sửa cấu hình giá vé" : "Thêm cấu hình giá vé"}
            </DialogTitle>
            <DialogDescription>
              Mỗi chặng chọn nhiều điểm đi và điểm đến. Giá áp dụng cho từng cặp.
            </DialogDescription>
          </DialogHeader>
          <FieldGroup className="gap-5">
            <div className="flex flex-col gap-3">
              <h3 className="text-sm font-medium">PHẠM VI ÁP DỤNG</h3>
              <Field>
                <FieldLabel>Tuyến đường</FieldLabel>
                <SearchableSelect
                  value={form.route_uuid}
                  items={routes.map((route) => ({
                    value: route.id,
                    label: `${route.route_code} · ${route.name}`,
                    description: itineraryLabel(route),
                  }))}
                  onValueChange={(value) => void changeRoute(value)}
                  placeholder="Chọn tuyến đường"
                  searchPlaceholder="Tìm tuyến..."
                  invalid={Boolean(errors.route_uuid)}
                />
                {errors.route_uuid ? (
                  <FieldError>{errors.route_uuid}</FieldError>
                ) : null}
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field>
                  <FieldLabel>Chuyến áp dụng</FieldLabel>
                  <SearchableSelect
                    value={form.schedule_uuid}
                    items={scheduleItems}
                    onValueChange={(value) =>
                      setForm((current) => ({ ...current, schedule_uuid: value }))
                    }
                    placeholder="Tất cả chuyến"
                    searchPlaceholder="Tìm chuyến..."
                  />
                </Field>
                <Field>
                  <FieldLabel>Sơ đồ ghế áp dụng</FieldLabel>
                  <SearchableSelect
                    value={form.seat_map_uuid}
                    items={seatMapItems}
                    onValueChange={(value) =>
                      setForm((current) => ({ ...current, seat_map_uuid: value }))
                    }
                    placeholder="Tất cả sơ đồ ghế"
                    searchPlaceholder="Tìm sơ đồ ghế..."
                  />
                </Field>
              </div>
              <Field orientation="horizontal" className="items-center gap-2">
                <Checkbox
                  id="fare-priority"
                  checked={form.priority}
                  onCheckedChange={(checked) =>
                    setForm((current) => ({
                      ...current,
                      priority: checked === true,
                    }))
                  }
                />
                <FieldLabel htmlFor="fare-priority" className="font-normal">
                  Cấu hình ưu tiên
                </FieldLabel>
              </Field>
            </div>

            <div className="flex flex-col gap-3">
              <h3 className="text-sm font-medium">THỜI GIAN ÁP DỤNG</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="fare-start">Ngày bắt đầu</FieldLabel>
                  <Input
                    id="fare-start"
                    type="date"
                    value={form.start_date}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        start_date: event.target.value,
                      }))
                    }
                  />
                  {errors.start_date ? (
                    <FieldError>{errors.start_date}</FieldError>
                  ) : null}
                </Field>
                <Field>
                  <FieldLabel htmlFor="fare-end">Ngày kết thúc</FieldLabel>
                  <Input
                    id="fare-end"
                    type="date"
                    value={form.end_date}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        end_date: event.target.value,
                      }))
                    }
                  />
                  {errors.end_date ? (
                    <FieldError>{errors.end_date}</FieldError>
                  ) : null}
                </Field>
              </div>
              <Field>
                <FieldLabel>Các thứ áp dụng</FieldLabel>
                <div className="flex flex-wrap gap-x-4 gap-y-2">
                  {WEEKDAYS.map((day) => (
                    <label
                      key={day.value}
                      className="flex cursor-pointer items-center gap-2 text-sm"
                    >
                      <Checkbox
                        checked={form.weekdays.includes(day.value)}
                        onCheckedChange={() => toggleWeekday(day.value)}
                      />
                      {day.label}
                    </label>
                  ))}
                </div>
                {errors.weekdays ? (
                  <FieldError>{errors.weekdays}</FieldError>
                ) : null}
              </Field>
            </div>

            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-sm font-medium">CẤU HÌNH CHI TIẾT</h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addSegment}
                  disabled={stopsLoading || stops.length < 2}
                >
                  <PlusIcon />
                  Thêm chặng
                </Button>
              </div>
              <div className="rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nơi đi</TableHead>
                      <TableHead>Nơi đến</TableHead>
                      <TableHead className="w-40">Giá vé</TableHead>
                      <TableHead className="w-12" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {form.segments.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={4}
                          className="h-16 text-center text-muted-foreground"
                        >
                          {stopsLoading
                            ? "Đang tải điểm dừng..."
                            : stops.length < 2
                              ? "Tuyến cần ít nhất hai điểm dừng để thêm chặng."
                              : "Chưa có chặng. Bấm Thêm chặng để chọn điểm."}
                        </TableCell>
                      </TableRow>
                    ) : (
                      form.segments.map((segment, index) => (
                        <TableRow key={segment.row_key}>
                          <TableCell className="align-top">
                            <PointTreeSelect
                              value={segment.origins.map((point) => point.id)}
                              points={stopPoints}
                              disabled={stopsLoading}
                              invalid={Boolean(errors.segments)}
                              onValueChange={(pointIds) =>
                                updateSegmentPoints(index, "origin", pointIds)
                              }
                            />
                          </TableCell>
                          <TableCell className="align-top">
                            <PointTreeSelect
                              value={segment.destinations.map((point) => point.id)}
                              points={stopPoints}
                              disabled={stopsLoading}
                              invalid={Boolean(errors.segments)}
                              onValueChange={(pointIds) =>
                                updateSegmentPoints(index, "destination", pointIds)
                              }
                            />
                          </TableCell>
                          <TableCell className="align-top">
                            <Input
                              inputMode="numeric"
                              value={
                                segment.price
                                  ? Number(segment.price).toLocaleString("vi-VN")
                                  : ""
                              }
                              placeholder="0"
                              aria-label="Giá vé"
                              onChange={(event) =>
                                updateSegmentPrice(index, event.target.value)
                              }
                            />
                          </TableCell>
                          <TableCell className="align-top">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => removeSegment(index)}
                            >
                              <Trash2Icon />
                              <span className="sr-only">Xóa chặng</span>
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
              {errors.segments ? <FieldError>{errors.segments}</FieldError> : null}
            </div>
          </FieldGroup>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setFormOpen(false)}
            >
              Hủy
            </Button>
            <Button onClick={() => void handleSave()} disabled={pending || !canManage}>
              {pending ? "Đang lưu..." : editing ? "Cập nhật" : "Thêm mới"}
            </Button>
          </DialogFooter>
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
            <AlertDialogTitle>Xóa cấu hình giá vé?</AlertDialogTitle>
            <AlertDialogDescription>
              Cấu hình từ {deleting ? formatDate(deleting.start_date) : ""} đến{" "}
              {deleting ? formatDate(deleting.end_date) : ""}
              {deleting?.priority ? ", đang đánh dấu ưu tiên," : ""} sẽ bị xóa.
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
