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
import {
  GripVerticalIcon,
  PencilIcon,
  PlusIcon,
  SearchIcon,
  Trash2Icon,
} from "lucide-react";
import { cn } from "cn";
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
import {
  createRoute,
  deleteRoute,
  emptyRouteInput,
  formatDuration,
  itineraryLabel,
  listRoutes,
  reorderRoutes,
  routeNameFromEndpoints,
  statusLabel,
  toRouteInput,
  toRoutePayload,
  updateRoute,
  type Route,
  type RouteInput,
} from "@/lib/routes";
import { toast } from "@/lib/toast";

export function RoutesPage() {
  const [companyUuid, setCompanyUuid] = useState<string | null>(null);
  const [canUpdate, setCanUpdate] = useState(false);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Route | null>(null);
  const [form, setForm] = useState<RouteInput>(emptyRouteInput);
  const [deleting, setDeleting] = useState<Route | null>(null);
  const [pending, setPending] = useState(false);
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  async function refresh(companyId: string) {
    const data = await listRoutes(companyId);
    setRoutes(data);
  }

  useEffect(() => {
    const account = getAccount();
    const companyId = account?.company_uuid ?? null;
    setCompanyUuid(companyId);
    setCanUpdate(Boolean(account?.permissions.includes("ROUTE.UPDATE")));

    if (!companyId) {
      setLoading(false);
      toast.warning(
        "Tài khoản chưa gắn với nhà xe.",
        "Chưa khai báo được tuyến đường.",
      );
      return;
    }

    refresh(companyId)
      .catch((error: unknown) => {
        toast.fromError(error, "Không tải được danh sách tuyến đường.");
      })
      .finally(() => setLoading(false));
  }, []);

  const filteredRoutes = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    if (!keyword) {
      return routes;
    }

    return routes.filter((route) =>
      [
        route.route_code,
        route.name,
        route.origin,
        route.destination,
        route.note,
      ]
        .join(" ")
        .toLowerCase()
        .includes(keyword),
    );
  }, [routes, query]);

  const canReorder =
    canUpdate && !query.trim() && !pending && routes.length > 1;

  function updateField<K extends keyof RouteInput>(
    key: K,
    value: RouteInput[K],
  ) {
    setForm((current) => {
      const next = { ...current, [key]: value };
      if (key === "origin" || key === "destination") {
        const previousAuto = routeNameFromEndpoints(
          current.origin,
          current.destination,
        );
        if (!current.name.trim() || current.name.trim() === previousAuto) {
          next.name = routeNameFromEndpoints(next.origin, next.destination);
        }
      }
      return next;
    });
  }

  function openCreate() {
    setEditing(null);
    setForm(emptyRouteInput());
    setFormOpen(true);
  }

  function openEdit(route: Route) {
    setEditing(route);
    setForm(toRouteInput(route));
    setFormOpen(true);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!companyUuid) {
      return;
    }

    const payload = toRoutePayload(form);
    setPending(true);

    try {
      if (editing) {
        await updateRoute(editing.id, payload);
        toast.success("Đã cập nhật tuyến đường.", payload.name);
      } else {
        await createRoute(companyUuid, payload);
        toast.success("Đã thêm tuyến đường.", payload.name);
      }
      await refresh(companyUuid);
      setFormOpen(false);
    } catch (error: unknown) {
      toast.fromError(error, "Không lưu được tuyến đường. Vui lòng thử lại.");
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
      await deleteRoute(deleting.id);
      await refresh(companyUuid);
      toast.success("Đã xóa tuyến đường.", deleting.name);
      setDeleting(null);
    } catch (error: unknown) {
      toast.fromError(error, "Không xóa được tuyến đường. Vui lòng thử lại.");
      setDeleting(null);
    } finally {
      setPending(false);
    }
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || !companyUuid || !canReorder || active.id === over.id) {
      return;
    }

    const oldIndex = routes.findIndex((route) => route.id === active.id);
    const newIndex = routes.findIndex((route) => route.id === over.id);
    if (oldIndex < 0 || newIndex < 0) {
      return;
    }

    const previous = routes;
    const next = arrayMove(routes, oldIndex, newIndex);
    setRoutes(next);
    setPending(true);

    try {
      const ordered = await reorderRoutes(
        companyUuid,
        next.map((route) => route.id),
      );
      setRoutes(ordered);
    } catch (error: unknown) {
      setRoutes(previous);
      toast.fromError(error, "Không lưu được thứ tự tuyến đường.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-800">
            Tuyến đường
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Khai báo tuyến, điểm đi và điểm đến. Kéo thả để sắp xếp thứ tự.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative min-w-0 flex-1 max-w-sm">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Tìm mã, tên, điểm đi, điểm đến..."
            className="pl-8"
          />
        </div>
        <Button onClick={openCreate} disabled={!companyUuid}>
          <PlusIcon />
          Thêm tuyến đường
        </Button>
      </div>

      <div className="overflow-hidden rounded-xl border bg-card">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          modifiers={[restrictToVerticalAxis]}
          onDragEnd={(event) => void handleDragEnd(event)}
        >
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10" />
                <TableHead>Mã tuyến</TableHead>
                <TableHead>Tên tuyến</TableHead>
                <TableHead>Hành trình</TableHead>
                <TableHead>Khoảng cách</TableHead>
                <TableHead>Thời gian</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead className="w-24 text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <SortableContext
              items={filteredRoutes.map((route) => route.id)}
              strategy={verticalListSortingStrategy}
            >
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="h-24 text-center text-muted-foreground"
                    >
                      Đang tải danh sách tuyến đường...
                    </TableCell>
                  </TableRow>
                ) : filteredRoutes.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="h-24 text-center text-muted-foreground"
                    >
                      {routes.length === 0
                        ? "Chưa có tuyến đường nào. Bấm Thêm tuyến đường để khai báo."
                        : "Không tìm thấy tuyến đường phù hợp."}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRoutes.map((route) => (
                    <RouteRow
                      key={route.id}
                      route={route}
                      sortable={canReorder}
                      onEdit={openEdit}
                      onDelete={setDeleting}
                    />
                  ))
                )}
              </TableBody>
            </SortableContext>
          </Table>
        </DndContext>
      </div>

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <form onSubmit={handleSubmit} className="grid gap-4">
            <DialogHeader>
              <DialogTitle>
                {editing ? "Sửa tuyến đường" : "Thêm tuyến đường"}
              </DialogTitle>
              <DialogDescription>
                Mã tuyến không trùng trong cùng nhà xe.
              </DialogDescription>
            </DialogHeader>

            <FieldGroup className="gap-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="route-code">Mã tuyến</FieldLabel>
                  <Input
                    id="route-code"
                    value={form.route_code}
                    onChange={(event) =>
                      updateField("route_code", event.target.value.toUpperCase())
                    }
                    placeholder="SG-DN"
                    className="uppercase"
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="route-name">Tên tuyến</FieldLabel>
                  <Input
                    id="route-name"
                    value={form.name}
                    onChange={(event) => updateField("name", event.target.value)}
                    placeholder="Sài Gòn - Đà Nẵng"
                  />
                </Field>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="route-origin">Điểm đi</FieldLabel>
                  <Input
                    id="route-origin"
                    value={form.origin}
                    onChange={(event) => updateField("origin", event.target.value)}
                    placeholder="Bến xe Miền Đông"
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="route-destination">Điểm đến</FieldLabel>
                  <Input
                    id="route-destination"
                    value={form.destination}
                    onChange={(event) =>
                      updateField("destination", event.target.value)
                    }
                    placeholder="Bến xe Đà Nẵng"
                  />
                </Field>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="route-distance">Khoảng cách (km)</FieldLabel>
                  <Input
                    id="route-distance"
                    inputMode="numeric"
                    value={form.distance_km}
                    onChange={(event) =>
                      updateField("distance_km", event.target.value)
                    }
                    placeholder="950"
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="route-duration">Thời gian (phút)</FieldLabel>
                  <Input
                    id="route-duration"
                    inputMode="numeric"
                    value={form.duration_minutes}
                    onChange={(event) =>
                      updateField("duration_minutes", event.target.value)
                    }
                    placeholder="1080"
                  />
                </Field>
              </div>

              <Field>
                <FieldLabel htmlFor="route-note">Ghi chú</FieldLabel>
                <Textarea
                  id="route-note"
                  value={form.note}
                  onChange={(event) => updateField("note", event.target.value)}
                  placeholder="Ghi chú nội bộ về tuyến..."
                />
              </Field>

              <Field orientation="horizontal" className="items-center gap-2">
                <Checkbox
                  id="route-status"
                  checked={form.status}
                  onCheckedChange={(checked) =>
                    updateField("status", checked === true)
                  }
                />
                <FieldLabel htmlFor="route-status" className="font-normal">
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
            <AlertDialogTitle>Xóa tuyến đường?</AlertDialogTitle>
            <AlertDialogDescription>
              Tuyến {deleting?.name} sẽ bị xóa khỏi hệ thống.
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

function RouteRow({
  route,
  sortable,
  onEdit,
  onDelete,
}: {
  route: Route;
  sortable: boolean;
  onEdit: (route: Route) => void;
  onDelete: (route: Route) => void;
}) {
  const itinerary = itineraryLabel(route);
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: route.id,
    disabled: !sortable,
  });

  return (
    <TableRow
      ref={setNodeRef}
      style={{
        transform: CSS.Translate.toString(transform),
        transition,
      }}
      className={isDragging ? "relative z-10 bg-card shadow-sm" : undefined}
    >
      <TableCell className="w-10 pr-0">
        <button
          type="button"
          className={cn(
            "inline-flex size-7 items-center justify-center rounded-md text-muted-foreground",
            sortable
              ? "cursor-grab hover:bg-muted active:cursor-grabbing"
              : "cursor-not-allowed opacity-40",
          )}
          aria-label={`Kéo để sắp xếp ${route.name}`}
          disabled={!sortable}
          {...(sortable ? { ...attributes, ...listeners } : {})}
        >
          <GripVerticalIcon />
        </button>
      </TableCell>
      <TableCell className="font-medium uppercase">{route.route_code}</TableCell>
      <TableCell>{route.name}</TableCell>
      <TableCell className="max-w-80 truncate" title={itinerary}>
        {itinerary}
      </TableCell>
      <TableCell>
        {route.distance_km ? `${route.distance_km} km` : "—"}
      </TableCell>
      <TableCell>{formatDuration(route.duration_minutes)}</TableCell>
      <TableCell
        className={route.status ? "text-emerald-700" : "text-muted-foreground"}
      >
        {statusLabel(route.status)}
      </TableCell>
      <TableCell className="text-right">
        <div className="flex justify-end gap-1">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => onEdit(route)}
          >
            <PencilIcon />
            <span className="sr-only">Sửa {route.name}</span>
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => onDelete(route)}
          >
            <Trash2Icon />
            <span className="sr-only">Xóa {route.name}</span>
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}
