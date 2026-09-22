"use client";

import { useEffect, useMemo, useState } from "react";
import { PencilIcon, PlusIcon, SearchIcon, Trash2Icon } from "lucide-react";
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
  countSeats,
  createSeatMap,
  defaultSeatCode,
  deleteSeatMap,
  emptySeatMapInput,
  generateSeats,
  layoutTypeLabel,
  listSeatMaps,
  SEAT_MAP_TYPES,
  statusLabel,
  toSeatMapInput,
  toSeatMapPayload,
  updateSeatMap,
  type SeatMap,
  type SeatMapCell,
  type SeatMapInput,
} from "@/lib/seat-maps";
import { toast } from "@/lib/toast";

function cellKey(cell: Pick<SeatMapCell, "floor" | "row" | "col">) {
  return `${cell.floor}-${cell.row}-${cell.col}`;
}

function SeatSizeSelect({
  id,
  value,
  max,
  onChange,
}: {
  id: string;
  value: string;
  max: number;
  onChange: (value: string) => void;
}) {
  const current = Number(value);
  const options = Array.from({ length: max }, (_, index) => index + 1);
  if (Number.isInteger(current) && current > max) {
    options.push(current);
  }
  const selected = options.includes(current) ? String(current) : "1";

  return (
    <select
      id={id}
      value={selected}
      onChange={(event) => onChange(event.target.value)}
      className="h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      {options.map((item) => (
        <option key={item} value={item}>
          {item}
        </option>
      ))}
    </select>
  );
}

export function SeatMapsPage() {
  const [companyUuid, setCompanyUuid] = useState<string | null>(null);
  const [seatMaps, setSeatMaps] = useState<SeatMap[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<SeatMap | null>(null);
  const [form, setForm] = useState<SeatMapInput>(emptySeatMapInput);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<SeatMap | null>(null);
  const [pending, setPending] = useState(false);

  async function refresh(companyId: string) {
    const data = await listSeatMaps(companyId);
    setSeatMaps(data);
  }

  useEffect(() => {
    const account = getAccount();
    const companyId = account?.company_uuid ?? null;
    setCompanyUuid(companyId);

    if (!companyId) {
      setLoading(false);
      toast.warning(
        "Tài khoản chưa gắn với nhà xe.",
        "Chưa khai báo được sơ đồ ghế.",
      );
      return;
    }

    refresh(companyId)
      .catch((error: unknown) => {
        toast.fromError(error, "Không tải được danh sách sơ đồ ghế.");
      })
      .finally(() => setLoading(false));
  }, []);

  const filteredSeatMaps = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    if (!keyword) {
      return seatMaps;
    }

    return seatMaps.filter((item) =>
      [item.seat_map_code, item.name, layoutTypeLabel(item.layout_type), item.note]
        .join(" ")
        .toLowerCase()
        .includes(keyword),
    );
  }, [seatMaps, query]);

  const floors = Math.max(1, Number(form.floors) || 1);
  const rows = Math.max(1, Number(form.rows) || 1);
  const columns = Math.max(1, Number(form.columns) || 1);
  const seatCount = countSeats(form.seats);

  function reshape(next: SeatMapInput) {
    const nextFloors = Math.max(1, Number(next.floors) || 1);
    const nextRows = Math.max(1, Number(next.rows) || 1);
    const nextColumns = Math.max(1, Number(next.columns) || 1);
    return {
      ...next,
      seats: generateSeats(nextFloors, nextRows, nextColumns, next.seats),
    };
  }

  function updateField<K extends keyof SeatMapInput>(
    key: K,
    value: SeatMapInput[K],
  ) {
    setForm((current) => {
      const next = { ...current, [key]: value };
      if (key === "floors" || key === "rows" || key === "columns") {
        return reshape(next);
      }
      return next;
    });
  }

  function updateSeatCode(cell: SeatMapCell, value: string) {
    const code = value.toUpperCase();
    setForm((current) => ({
      ...current,
      seats: current.seats.map((item) =>
        cellKey(item) === cellKey(cell)
          ? {
              ...item,
              code,
              type: code.trim() ? "seat" : "empty",
            }
          : item,
      ),
    }));
  }

  function openCreate() {
    setEditing(null);
    setForm(emptySeatMapInput());
    setSelectedKey(null);
    setFormOpen(true);
  }

  function openEdit(seatMap: SeatMap) {
    setEditing(seatMap);
    setForm(toSeatMapInput(seatMap));
    setSelectedKey(null);
    setFormOpen(true);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!companyUuid) {
      return;
    }

    const payload = toSeatMapPayload(form);
    setPending(true);

    try {
      if (editing) {
        await updateSeatMap(editing.id, payload);
        toast.success("Đã cập nhật sơ đồ ghế.", payload.name);
      } else {
        await createSeatMap(companyUuid, payload);
        toast.success("Đã thêm sơ đồ ghế.", payload.name);
      }
      await refresh(companyUuid);
      setFormOpen(false);
    } catch (error: unknown) {
      toast.fromError(error, "Không lưu được sơ đồ ghế. Vui lòng thử lại.");
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
      await deleteSeatMap(deleting.id);
      await refresh(companyUuid);
      toast.success("Đã xóa sơ đồ ghế.", deleting.name);
      setDeleting(null);
    } catch (error: unknown) {
      toast.fromError(error, "Không xóa được sơ đồ ghế. Vui lòng thử lại.");
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
            Sơ đồ ghế
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Khai báo sơ đồ ghế theo tầng, hàng và cột. Bấm ô để sửa tên ghế.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative min-w-0 flex-1 max-w-sm">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Tìm mã, tên sơ đồ..."
            className="pl-8"
          />
        </div>
        <Button onClick={openCreate} disabled={!companyUuid}>
          <PlusIcon />
          Thêm sơ đồ ghế
        </Button>
      </div>

      <div className="overflow-hidden rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Mã sơ đồ</TableHead>
              <TableHead>Tên sơ đồ</TableHead>
              <TableHead>Loại sơ đồ</TableHead>
              <TableHead>Tầng</TableHead>
              <TableHead>Kích thước</TableHead>
              <TableHead>Số ghế</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead className="w-24 text-right">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="h-24 text-center text-muted-foreground"
                >
                  Đang tải danh sách sơ đồ ghế...
                </TableCell>
              </TableRow>
            ) : filteredSeatMaps.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="h-24 text-center text-muted-foreground"
                >
                  {seatMaps.length === 0
                    ? "Chưa có sơ đồ ghế nào. Bấm Thêm sơ đồ ghế để khai báo."
                    : "Không tìm thấy sơ đồ ghế phù hợp."}
                </TableCell>
              </TableRow>
            ) : (
              filteredSeatMaps.map((seatMap) => (
                <TableRow key={seatMap.id}>
                  <TableCell className="font-medium uppercase">
                    {seatMap.seat_map_code}
                  </TableCell>
                  <TableCell>{seatMap.name}</TableCell>
                  <TableCell>{layoutTypeLabel(seatMap.layout_type)}</TableCell>
                  <TableCell>{seatMap.floors}</TableCell>
                  <TableCell>
                    {seatMap.rows} hàng × {seatMap.columns} cột
                  </TableCell>
                  <TableCell>{seatMap.seat_count}</TableCell>
                  <TableCell
                    className={
                      seatMap.status
                        ? "text-emerald-700"
                        : "text-muted-foreground"
                    }
                  >
                    {statusLabel(seatMap.status)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => openEdit(seatMap)}
                      >
                        <PencilIcon />
                        <span className="sr-only">Sửa {seatMap.name}</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => setDeleting(seatMap)}
                      >
                        <Trash2Icon />
                        <span className="sr-only">Xóa {seatMap.name}</span>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) {
            setSelectedKey(null);
          }
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-4xl">
          <form onSubmit={handleSubmit} className="grid gap-4">
            <DialogHeader>
              <DialogTitle>
                {editing ? "Sửa sơ đồ ghế" : "Thêm sơ đồ ghế"}
              </DialogTitle>
              <DialogDescription>
                Mã sơ đồ không trùng trong cùng nhà xe. Bấm ô trên lưới để sửa
                tên ghế. Xóa tên nếu ô đó là lối đi.
              </DialogDescription>
            </DialogHeader>

            <FieldGroup className="gap-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="seat-map-code">Mã sơ đồ</FieldLabel>
                  <Input
                    id="seat-map-code"
                    value={form.seat_map_code}
                    onChange={(event) =>
                      updateField(
                        "seat_map_code",
                        event.target.value.toUpperCase(),
                      )
                    }
                    placeholder="GHE-40"
                    className="uppercase"
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="seat-map-name">Tên sơ đồ</FieldLabel>
                  <Input
                    id="seat-map-name"
                    value={form.name}
                    onChange={(event) =>
                      updateField("name", event.target.value)
                    }
                    placeholder="Giường nằm 40 chỗ"
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="seat-map-layout-type">
                    Loại sơ đồ
                  </FieldLabel>
                  <select
                    id="seat-map-layout-type"
                    value={form.layout_type}
                    onChange={(event) =>
                      updateField(
                        "layout_type",
                        event.target.value as SeatMapInput["layout_type"],
                      )
                    }
                    className="h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                  >
                    {SEAT_MAP_TYPES.map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <Field>
                  <FieldLabel htmlFor="seat-map-floors">Số tầng</FieldLabel>
                  <SeatSizeSelect
                    id="seat-map-floors"
                    value={form.floors}
                    max={3}
                    onChange={(value) => updateField("floors", value)}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="seat-map-rows">Số hàng</FieldLabel>
                  <SeatSizeSelect
                    id="seat-map-rows"
                    value={form.rows}
                    max={20}
                    onChange={(value) => updateField("rows", value)}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="seat-map-columns">Số cột</FieldLabel>
                  <SeatSizeSelect
                    id="seat-map-columns"
                    value={form.columns}
                    max={10}
                    onChange={(value) => updateField("columns", value)}
                  />
                </Field>
              </div>

              <Field>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <FieldLabel>Sơ đồ</FieldLabel>
                  <p className="text-xs text-muted-foreground">
                    {seatCount} ghế
                  </p>
                </div>
                <div
                  className={cn(
                    "flex gap-3 overflow-x-auto",
                    floors > 1 ? "flex-row items-start" : "flex-col",
                  )}
                >
                  {Array.from({ length: floors }, (_, index) => index + 1).map(
                    (floor) => (
                      <SeatMapGrid
                        key={floor}
                        seats={form.seats}
                        floor={floor}
                        rows={rows}
                        columns={columns}
                        title={floors > 1 ? `Tầng ${floor}` : "Phía tài xế"}
                        selectedKey={selectedKey}
                        onSelect={setSelectedKey}
                        onChangeCode={updateSeatCode}
                      />
                    ),
                  )}
                </div>
              </Field>

              <Field>
                <FieldLabel htmlFor="seat-map-note">Ghi chú</FieldLabel>
                <Textarea
                  id="seat-map-note"
                  value={form.note}
                  onChange={(event) => updateField("note", event.target.value)}
                  placeholder="Ghi chú nội bộ về sơ đồ ghế..."
                />
              </Field>

              <Field orientation="horizontal" className="items-center gap-2">
                <Checkbox
                  id="seat-map-status"
                  checked={form.status}
                  onCheckedChange={(checked) =>
                    updateField("status", checked === true)
                  }
                />
                <FieldLabel htmlFor="seat-map-status" className="font-normal">
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
            <AlertDialogTitle>Xóa sơ đồ ghế?</AlertDialogTitle>
            <AlertDialogDescription>
              Sơ đồ {deleting?.name} sẽ bị xóa khỏi hệ thống.
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

function SeatMapGrid({
  seats,
  floor,
  rows,
  columns,
  title,
  selectedKey,
  onSelect,
  onChangeCode,
}: {
  seats: SeatMapCell[];
  floor: number;
  rows: number;
  columns: number;
  title: string;
  selectedKey: string | null;
  onSelect: (key: string) => void;
  onChangeCode: (cell: SeatMapCell, value: string) => void;
}) {
  const cells = new Map(
    seats
      .filter((cell) => cell.floor === floor)
      .map((cell) => [`${cell.row}-${cell.col}`, cell]),
  );

  return (
    <div className="min-w-fit flex-1 overflow-x-auto rounded-xl border bg-slate-50 p-3">
      <p className="mb-2 text-center text-xs text-muted-foreground">{title}</p>
      <div
        className="inline-grid gap-1"
        style={{
          gridTemplateColumns: `repeat(${columns}, minmax(2.5rem, 1fr))`,
        }}
      >
        {Array.from({ length: rows }, (_, rowIndex) => {
          const row = rowIndex + 1;
          return (
            <div key={`row-${row}`} className="contents">
              {Array.from({ length: columns }, (_, colIndex) => {
                const col = colIndex + 1;
                const cell = cells.get(`${row}-${col}`) ?? {
                  floor,
                  row,
                  col,
                  code: defaultSeatCode(row, col),
                  type: "seat" as const,
                };
                const isSeat = cell.type === "seat";
                const isSelected = selectedKey === cellKey(cell);
                return (
                  <button
                    key={`${row}-${col}`}
                    type="button"
                    title={isSeat ? cell.code : "Lối đi / trống"}
                    onClick={() => onSelect(cellKey(cell))}
                    className={cn(
                      "flex h-9 min-w-12 max-w-25 items-center justify-center rounded-md text-[11px] font-semibold transition-colors",
                      isSeat
                        ? "bg-sky-600 text-white hover:bg-sky-700"
                        : "border border-dashed border-slate-300 bg-white text-slate-400 hover:bg-slate-100",
                      isSelected && "ring-2 ring-amber-400 ring-offset-1",
                    )}
                  >
                    {isSelected ? (
                      <input
                        value={cell.code}
                        autoFocus
                        aria-label={`Tên ghế tầng ${floor} hàng ${row} cột ${col}`}
                        placeholder={defaultSeatCode(row, col)}
                        onChange={(event) =>
                          onChangeCode(cell, event.target.value)
                        }
                        onClick={(event) => event.stopPropagation()}
                        onKeyDown={(event) => {
                          if (event.key === "Enter") {
                            event.preventDefault();
                          }
                        }}
                        className={cn(
                          "h-full w-full bg-transparent text-center text-[11px] font-semibold uppercase outline-none placeholder:text-current/40",
                          isSeat ? "text-white" : "text-slate-600",
                        )}
                      />
                    ) : isSeat ? (
                      cell.code
                    ) : (
                      ""
                    )}
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
