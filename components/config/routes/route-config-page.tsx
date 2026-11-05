"use client";

import { useEffect, useMemo, useState } from "react";
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVerticalIcon, PlusIcon, SearchIcon, Trash2Icon } from "lucide-react";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { useHasPermission } from "@/features/permission/hooks/use-has-permission";
import { useAuthStore } from "@/features/auth/stores/auth.store";
import { locationAddress } from "@/lib/locations";
import type { Point } from "@/types/points";
import { pointTypeLabel } from "@/lib/points";
import { listPoints } from "@/service/points";
import type { RouteStopDraft } from "@/types/route-stops";
import { draftFromPoint, draftFromStop } from "@/lib/route-stops";
import { listRouteStops, saveRouteStops } from "@/service/route-stops";
import type { Route } from "@/types/routes";
import { formatDuration, itineraryLabel } from "@/lib/routes";
import { listRoutes } from "@/service/routes";
import { toast } from "@/lib/toast";

function stopsKey(stops: RouteStopDraft[]) {
  return JSON.stringify(
    stops.map((stop) => ({
      id: stop.point.id,
      duration_minutes: stop.duration_minutes,
    })),
  );
}

function withDeparture(stops: RouteStopDraft[]) {
  if (!stops[0] || stops[0].duration_minutes === 0) {
    return stops;
  }
  return stops.map((stop, index) =>
    index === 0 ? { ...stop, duration_minutes: 0 } : stop,
  );
}

export function RouteConfigPage() {
  const [companyUuid, setCompanyUuid] = useState<string | null>(null);
  const canUpdate = useHasPermission("ROUTE_UPDATE");
  const [routes, setRoutes] = useState<Route[]>([]);
  const [routeId, setRouteId] = useState("");
  const [points, setPoints] = useState<Point[]>([]);
  const [pointQuery, setPointQuery] = useState("");
  const [stops, setStops] = useState<RouteStopDraft[]>([]);
  const [baseline, setBaseline] = useState("[]");
  const [loading, setLoading] = useState(true);
  const [stopsLoading, setStopsLoading] = useState(false);
  const [pending, setPending] = useState(false);
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  useEffect(() => {
    const account = useAuthStore.getState().account;
    const companyId = account?.company_uuid ?? null;
    setCompanyUuid(companyId);

    if (!companyId) {
      setLoading(false);
      toast.warning(
        "Tài khoản chưa gắn với nhà xe.",
        "Chưa cấu hình được tuyến đường.",
      );
      return;
    }

    Promise.all([listRoutes(companyId), listPoints(companyId)])
      .then(([nextRoutes, nextPoints]) => {
        setRoutes(nextRoutes);
        setPoints(nextPoints);
      })
      .catch((error: unknown) => {
        toast.fromError(error, "Không tải được dữ liệu tuyến đường.");
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!routeId) {
      setStops([]);
      setBaseline("[]");
      return;
    }

    let cancelled = false;
    setStopsLoading(true);
    listRouteStops(routeId)
      .then((items) => {
        if (cancelled) {
          return;
        }
        const draft = items.map(draftFromStop);
        setStops(draft);
        setBaseline(stopsKey(draft));
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setStops([]);
          setBaseline("[]");
          toast.fromError(error, "Không tải được điểm dừng của tuyến.");
        }
      })
      .finally(() => {
        if (!cancelled) {
          setStopsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [routeId]);

  const selectedRoute = routes.find((route) => route.id === routeId);
  const dirty = stopsKey(stops) !== baseline;
  const totalMinutes = stops[stops.length - 1]?.duration_minutes ?? 0;
  const routeItems = useMemo(
    () =>
      routes.map((route) => ({
        value: route.id,
        label: `${route.route_code} · ${route.name}`,
        description: [
          itineraryLabel(route),
          route.status ? "" : "Ngưng hoạt động",
        ]
          .filter(Boolean)
          .join(" · "),
      })),
    [routes],
  );
  const availablePoints = useMemo(() => {
    const used = new Set(stops.map((stop) => stop.point.id));
    const keyword = pointQuery.trim().toLowerCase();
    return points
      .filter((point) => !used.has(point.id))
      .filter((point) => {
        if (!keyword) {
          return true;
        }
        return [
          point.point_code,
          point.name,
          pointTypeLabel(point.point_type),
          point.address,
          point.ward_name,
          point.province_name,
        ]
          .join(" ")
          .toLowerCase()
          .includes(keyword);
      })
      .sort((left, right) => left.name.localeCompare(right.name, "vi"));
  }, [pointQuery, points, stops]);

  function addPoint(pointId: string) {
    if (!routeId) {
      toast.warning("Chọn tuyến trước khi thêm điểm dừng.");
      return;
    }
    const point = points.find((item) => item.id === pointId);
    if (!point || stops.some((stop) => stop.point.id === pointId)) {
      return;
    }
    setStops((current) => {
      const last = current[current.length - 1];
      const minutes = current.length === 0 ? 0 : (last?.duration_minutes ?? 0) + 30;
      return [...current, draftFromPoint(point, minutes)];
    });
  }

  function updateDuration(pointId: string, minutes: number) {
    setStops((current) =>
      current.map((stop, index) => {
        if (stop.point.id !== pointId || index === 0) {
          return stop;
        }
        return { ...stop, duration_minutes: minutes };
      }),
    );
  }

  function removeStop(pointId: string) {
    setStops((current) =>
      withDeparture(current.filter((stop) => stop.point.id !== pointId)),
    );
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) {
      return;
    }
    setStops((current) => {
      const oldIndex = current.findIndex((stop) => stop.point.id === active.id);
      const newIndex = current.findIndex((stop) => stop.point.id === over.id);
      if (oldIndex < 0 || newIndex < 0) {
        return current;
      }
      return withDeparture(arrayMove(current, oldIndex, newIndex));
    });
  }

  async function handleSave() {
    if (!routeId || !canUpdate) {
      return;
    }
    setPending(true);
    try {
      const saved = await saveRouteStops(routeId, stops);
      const draft = saved.map(draftFromStop);
      setStops(draft);
      setBaseline(stopsKey(draft));
      toast.success("Đã lưu điểm dừng của tuyến.");
    } catch (error: unknown) {
      toast.fromError(error, "Không lưu được điểm dừng của tuyến.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-800">
          Tuyến đường
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Chọn tuyến, thêm điểm dừng, kéo để sắp xếp và chỉnh số phút so với
          điểm đầu.
        </p>
      </div>

      <div className="max-w-xl">
        <SearchableSelect
          id="route-config-route"
          value={routeId}
          items={routeItems}
          onValueChange={(nextId) => {
            if (
              nextId !== routeId &&
              dirty &&
              !window.confirm("Thay đổi chưa lưu sẽ bị bỏ. Tiếp tục đổi tuyến?")
            ) {
              return;
            }
            setRouteId(nextId);
          }}
          disabled={loading || !companyUuid}
          placeholder={loading ? "Đang tải tuyến..." : "Chọn tuyến đường"}
          searchPlaceholder="Tìm mã, tên tuyến..."
          emptyText="Không có tuyến đường."
        />
      </div>

      <div className="grid items-start gap-4 lg:grid-cols-[22rem_minmax(0,1fr)]">
        <section className="overflow-hidden rounded-xl border bg-card">
          <div className="flex flex-col gap-3 border-b p-3">
            <h2 className="text-sm font-medium">Điểm dừng có thể thêm</h2>
            <div className="relative">
              <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={pointQuery}
                onChange={(event) => setPointQuery(event.target.value)}
                placeholder="Tìm điểm dừng..."
                className="pl-8"
              />
            </div>
          </div>
          <ul className="max-h-[32rem] overflow-y-auto">
            {loading ? (
              <li className="px-3 py-10 text-center text-sm text-muted-foreground">
                Đang tải điểm dừng...
              </li>
            ) : availablePoints.length === 0 ? (
              <li className="px-3 py-10 text-center text-sm text-muted-foreground">
                {points.length === 0
                  ? "Chưa có điểm dừng. Hãy khai báo điểm dừng trước."
                  : "Không còn điểm dừng phù hợp."}
              </li>
            ) : (
              availablePoints.map((point) => (
                <li
                  key={point.id}
                  className="flex items-center gap-2 border-b px-3 py-2 last:border-b-0"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{point.name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {point.point_code} · {pointTypeLabel(point.point_type)}
                      {point.shared ? " · Hệ thống" : ""}
                      {point.status ? "" : " · Ngưng"}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={!canUpdate}
                    onClick={() => addPoint(point.id)}
                  >
                    <PlusIcon />
                    Thêm
                  </Button>
                </li>
              ))
            )}
          </ul>
        </section>

        <section className="flex flex-col gap-3">
          {!routeId ? (
            <div className="rounded-xl border bg-card px-4 py-16 text-center text-sm text-muted-foreground">
              Chọn một tuyến, rồi bấm Thêm ở danh sách điểm dừng bên cạnh.
            </div>
          ) : (
            <>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-muted-foreground">
                  {selectedRoute ? itineraryLabel(selectedRoute) : ""}
                  {stops.length > 0
                    ? ` · ${stops.length} điểm · Tổng ${formatMinutes(totalMinutes)}`
                    : ""}
                </p>
                <Button
                  onClick={() => void handleSave()}
                  disabled={!canUpdate || !dirty || pending || stopsLoading}
                >
                  {pending ? "Đang lưu..." : "Lưu cấu hình"}
                </Button>
              </div>
              {dirty ? (
                <p className="text-xs text-amber-700">Có thay đổi chưa lưu.</p>
              ) : null}
              <div className="overflow-hidden rounded-xl border bg-card">
                {stopsLoading ? (
                  <p className="px-4 py-16 text-center text-sm text-muted-foreground">
                    Đang tải điểm dừng của tuyến...
                  </p>
                ) : stops.length === 0 ? (
                  <p className="px-4 py-16 text-center text-sm text-muted-foreground">
                    Tuyến chưa có điểm dừng. Bấm Thêm ở danh sách bên cạnh.
                  </p>
                ) : (
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    modifiers={[restrictToVerticalAxis]}
                    onDragEnd={handleDragEnd}
                  >
                    <SortableContext
                      items={stops.map((stop) => stop.point.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      <ol>
                        {stops.map((stop, index) => (
                          <StopRow
                            key={stop.point.id}
                            stop={stop}
                            index={index}
                            arrival={stop.duration_minutes}
                            sortable={canUpdate}
                            onDurationChange={updateDuration}
                            onRemove={removeStop}
                          />
                        ))}
                      </ol>
                    </SortableContext>
                  </DndContext>
                )}
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}

function StopRow({
  stop,
  index,
  arrival,
  sortable,
  onDurationChange,
  onRemove,
}: {
  stop: RouteStopDraft;
  index: number;
  arrival: number;
  sortable: boolean;
  onDurationChange: (pointId: string, minutes: number) => void;
  onRemove: (pointId: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: stop.point.id,
    disabled: !sortable,
  });
  const address = locationAddress(
    stop.point.address,
    stop.point.ward_name,
    stop.point.province_name,
  );
  const isOrigin = index === 0;

  return (
    <li
      ref={setNodeRef}
      style={{
        transform: CSS.Translate.toString(transform),
        transition,
      }}
      className={cn(
        "flex items-center gap-3 border-b px-3 py-3 last:border-b-0",
        isDragging && "relative z-10 bg-card shadow-sm",
      )}
    >
      <button
        type="button"
        className={cn(
          "inline-flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground",
          sortable
            ? "cursor-grab hover:bg-muted active:cursor-grabbing"
            : "cursor-not-allowed opacity-40",
        )}
        aria-label={`Kéo để sắp xếp ${stop.point.name}`}
        disabled={!sortable}
        {...(sortable ? { ...attributes, ...listeners } : {})}
      >
        <GripVerticalIcon />
      </button>
      <span className="w-6 shrink-0 text-sm text-muted-foreground">
        {index + 1}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">
          {stop.point.name}
          {stop.point.shared ? (
            <span className="ml-2 text-xs font-normal text-muted-foreground">
              Hệ thống
            </span>
          ) : null}
        </p>
        <p className="truncate text-xs text-muted-foreground">
          {stop.point.point_code} · {pointTypeLabel(stop.point.point_type)}
          {address ? ` · ${address}` : ""}
        </p>
      </div>
      <div className="flex w-44 shrink-0 flex-col gap-1">
        <label className="text-xs text-muted-foreground">
          {isOrigin ? "Xuất phát" : "Sau điểm đầu"}
        </label>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            min={0}
            step={5}
            value={isOrigin ? 0 : stop.duration_minutes}
            disabled={isOrigin || !sortable}
            aria-label={
              isOrigin
                ? "Điểm xuất phát"
                : `Số phút so với điểm đầu của ${stop.point.name}`
            }
            onChange={(event) => {
              const next = Number(event.target.value);
              onDurationChange(
                stop.point.id,
                Number.isFinite(next) ? Math.max(0, Math.floor(next)) : 0,
              );
            }}
            className="w-20"
          />
          <span className="text-xs text-muted-foreground">phút</span>
        </div>
        <p className="text-xs text-muted-foreground">
          {isOrigin ? "Mốc 0 phút" : `Đến sau ${formatMinutes(arrival)} kể từ điểm đầu`}
        </p>
      </div>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        disabled={!sortable}
        onClick={() => onRemove(stop.point.id)}
      >
        <Trash2Icon />
        <span className="sr-only">Xóa {stop.point.name} khỏi tuyến</span>
      </Button>
    </li>
  );
}

function formatMinutes(minutes: number) {
  const label = formatDuration(minutes);
  return label === "—" ? "0 phút" : label;
}
