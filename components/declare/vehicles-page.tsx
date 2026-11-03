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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAuthStore } from "@/features/auth/stores/auth.store";
import type { Office } from "@/features/office/types/office.types";
import { listOffices } from "@/features/office/services/office.service";
import { toast } from "@/lib/toast";
import type { Vehicle, VehicleInput } from "@/types/vehicles";
import {
  emptyVehicleInput,
  toVehicleInput,
  toVehiclePayload,
  vehicleConditionLabel,
  vehicleStatusLabel,
  VEHICLE_CONDITIONS,
  VEHICLE_STATUSES,
} from "@/lib/vehicles";
import { createVehicle, deleteVehicle, listVehicles, updateVehicle } from "@/service/vehicles";

const SELECT_CLASS =
  "h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

const STATUS_TONE: Record<string, string> = {
  IN_USE: "text-emerald-700",
  MAINTENANCE: "text-amber-600",
  INACTIVE: "text-muted-foreground",
  SOLD: "text-muted-foreground",
};

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="grid gap-3">
      <h3 className="border-b pb-1 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
        {title}
      </h3>
      <div className="grid gap-3 sm:grid-cols-3">{children}</div>
    </section>
  );
}

export function VehiclesPage() {
  const [companyUuid, setCompanyUuid] = useState<string | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [offices, setOffices] = useState<Office[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Vehicle | null>(null);
  const [form, setForm] = useState<VehicleInput>(emptyVehicleInput);
  const [deleting, setDeleting] = useState<Vehicle | null>(null);
  const [pending, setPending] = useState(false);

  async function refresh(companyId: string) {
    setVehicles(await listVehicles(companyId));
  }

  useEffect(() => {
    const companyId = useAuthStore.getState().account?.company_uuid ?? null;
    setCompanyUuid(companyId);

    if (!companyId) {
      setLoading(false);
      toast.warning(
        "Tài khoản chưa gắn với nhà xe.",
        "Chưa khai báo được phương tiện.",
      );
      return;
    }

    Promise.all([
      refresh(companyId),
      listOffices().then(setOffices),
    ])
      .catch((error: unknown) => {
        toast.fromError(error, "Không tải được danh sách phương tiện.");
      })
      .finally(() => setLoading(false));
  }, []);

  const filteredVehicles = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    if (!keyword) {
      return vehicles;
    }

    return vehicles.filter((item) =>
      [
        item.license_plate,
        item.engine_number,
        item.chassis_number,
        item.brand,
        item.owner_name,
      ]
        .join(" ")
        .toLowerCase()
        .includes(keyword),
    );
  }, [vehicles, query]);

  function updateField<K extends keyof VehicleInput>(
    key: K,
    value: VehicleInput[K],
  ) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function textField(
    key: keyof VehicleInput,
    label: string,
    options: { type?: string; placeholder?: string; upper?: boolean } = {},
  ) {
    const id = `vehicle-${key}`;
    return (
      <Field>
        <FieldLabel htmlFor={id}>{label}</FieldLabel>
        <Input
          id={id}
          type={options.type}
          min={options.type === "number" ? 0 : undefined}
          value={form[key]}
          placeholder={options.placeholder}
          className={options.upper ? "uppercase" : undefined}
          onChange={(event) =>
            updateField(
              key,
              (options.upper
                ? event.target.value.toUpperCase()
                : event.target.value) as never,
            )
          }
        />
      </Field>
    );
  }

  function openCreate() {
    setEditing(null);
    setForm(emptyVehicleInput());
    setFormOpen(true);
  }

  function openEdit(vehicle: Vehicle) {
    setEditing(vehicle);
    setForm(toVehicleInput(vehicle));
    setFormOpen(true);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!companyUuid) {
      return;
    }

    const payload = toVehiclePayload(form);
    if (!payload.license_plate) {
      toast.warning("Vui lòng nhập biển số xe.");
      return;
    }

    setPending(true);
    try {
      if (editing) {
        await updateVehicle(editing.id, payload);
        toast.success("Đã cập nhật phương tiện.", payload.license_plate);
      } else {
        await createVehicle(companyUuid, payload);
        toast.success("Đã thêm phương tiện.", payload.license_plate);
      }
      await refresh(companyUuid);
      setFormOpen(false);
    } catch (error: unknown) {
      toast.fromError(error, "Không lưu được phương tiện. Vui lòng thử lại.");
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
      await deleteVehicle(deleting.id);
      await refresh(companyUuid);
      toast.success("Đã xóa phương tiện.", deleting.license_plate);
    } catch (error: unknown) {
      toast.fromError(error, "Không xóa được phương tiện. Vui lòng thử lại.");
    } finally {
      setDeleting(null);
      setPending(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-800">
          Phương tiện
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Khai báo danh sách xe của nhà xe: thông tin định danh, thông số kỹ
          thuật, nguồn gốc sở hữu và tình trạng sử dụng.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative min-w-0 max-w-sm flex-1">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Tìm biển số, số khung, nhãn hiệu..."
            className="pl-8"
          />
        </div>
        <Button onClick={openCreate} disabled={!companyUuid}>
          <PlusIcon />
          Thêm phương tiện
        </Button>
      </div>

      <div className="overflow-hidden rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Biển số</TableHead>
              <TableHead>Số chỗ</TableHead>
              <TableHead>Nhãn hiệu</TableHead>
              <TableHead>Năm SX</TableHead>
              <TableHead>Chi nhánh</TableHead>
              <TableHead>Tình trạng</TableHead>
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
                  Đang tải danh sách phương tiện...
                </TableCell>
              </TableRow>
            ) : filteredVehicles.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="h-24 text-center text-muted-foreground"
                >
                  {vehicles.length === 0
                    ? "Chưa có phương tiện nào. Bấm Thêm phương tiện để khai báo."
                    : "Không tìm thấy phương tiện phù hợp."}
                </TableCell>
              </TableRow>
            ) : (
              filteredVehicles.map((vehicle) => (
                <TableRow key={vehicle.id}>
                  <TableCell className="font-medium uppercase">
                    {vehicle.license_plate}
                  </TableCell>
                  <TableCell>{vehicle.seat_count || "—"}</TableCell>
                  <TableCell>{vehicle.brand || "—"}</TableCell>
                  <TableCell>{vehicle.manufacture_year ?? "—"}</TableCell>
                  <TableCell>{vehicle.office?.name ?? "—"}</TableCell>
                  <TableCell>{vehicleConditionLabel(vehicle.condition)}</TableCell>
                  <TableCell className={STATUS_TONE[vehicle.status]}>
                    {vehicleStatusLabel(vehicle.status)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => openEdit(vehicle)}
                      >
                        <PencilIcon />
                        <span className="sr-only">
                          Sửa {vehicle.license_plate}
                        </span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => setDeleting(vehicle)}
                      >
                        <Trash2Icon />
                        <span className="sr-only">
                          Xóa {vehicle.license_plate}
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
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
          <form onSubmit={handleSubmit} className="grid gap-5">
            <DialogHeader>
              <DialogTitle>
                {editing ? "Sửa phương tiện" : "Khai báo phương tiện"}
              </DialogTitle>
              <DialogDescription>
                Biển số xe không được trùng trong cùng nhà xe.
              </DialogDescription>
            </DialogHeader>

            <FieldGroup className="gap-5">
              <Section title="Thông tin định danh">
                {textField("license_plate", "Biển số xe", {
                  upper: true,
                  placeholder: "51B-123.45",
                })}
                {textField("engine_number", "Số máy")}
                {textField("chassis_number", "Số khung")}
              </Section>

              <Section title="Thông số kỹ thuật">
                {textField("seat_count", "Số chỗ", { type: "number" })}
                {textField("model_code", "Số loại")}
                {textField("vehicle_kind", "Loại xe")}
                {textField("color", "Màu sơn")}
                {textField("payload", "Khối lượng toàn bộ (kg)", { type: "number" })}
                {textField("initial_odometer", "Công tơ mét ban đầu (km)", {
                  type: "number",
                })}
              </Section>

              <Section title="Nguồn gốc sở hữu">
                {textField("brand", "Nhãn hiệu")}
                {textField("manufacture_year", "Năm sản xuất", {
                  type: "number",
                })}
                {textField("manufacture_country", "Nước sản xuất")}
                {textField("service_life_year", "Niên hạn (năm)", {
                  type: "number",
                })}
                {textField("owner_name", "Tên chủ xe")}
                {textField("registration_date", "Ngày đăng ký", {
                  type: "date",
                })}
                <Field>
                  <FieldLabel htmlFor="vehicle-office_uuid">
                    Chi nhánh quản lý
                  </FieldLabel>
                  <select
                    id="vehicle-office_uuid"
                    value={form.office_uuid}
                    onChange={(event) =>
                      updateField("office_uuid", event.target.value)
                    }
                    className={SELECT_CLASS}
                  >
                    <option value="">— Chọn chi nhánh —</option>
                    {offices.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                </Field>
              </Section>

              <Section title="Tình trạng sử dụng">
                <Field>
                  <FieldLabel htmlFor="vehicle-condition">Tình trạng xe</FieldLabel>
                  <select
                    id="vehicle-condition"
                    value={form.condition}
                    onChange={(event) =>
                      updateField(
                        "condition",
                        event.target.value as VehicleInput["condition"],
                      )
                    }
                    className={SELECT_CLASS}
                  >
                    {VEHICLE_CONDITIONS.map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field>
                  <FieldLabel htmlFor="vehicle-status">Trạng thái</FieldLabel>
                  <select
                    id="vehicle-status"
                    value={form.status}
                    onChange={(event) =>
                      updateField(
                        "status",
                        event.target.value as VehicleInput["status"],
                      )
                    }
                    className={SELECT_CLASS}
                  >
                    {VEHICLE_STATUSES.map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </Field>
              </Section>
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
            <AlertDialogTitle>Xóa phương tiện?</AlertDialogTitle>
            <AlertDialogDescription>
              Phương tiện {deleting?.license_plate} sẽ bị xóa khỏi hệ thống.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={handleDelete}
              disabled={pending}
            >
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
