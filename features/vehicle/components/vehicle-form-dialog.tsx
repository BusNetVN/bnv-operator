"use client";

import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import type { Office } from "@/features/office/types/office.types";
import {
  vehicleSchema,
  type VehicleFormValues,
} from "@/features/vehicle/schemas/vehicle.schema";
import {
  createVehicle,
  updateVehicle,
} from "@/features/vehicle/services/vehicle.service";
import type { Vehicle } from "@/features/vehicle/types/vehicle.types";
import {
  emptyVehicleInput,
  toVehicleInput,
  VEHICLE_CONDITIONS,
  VEHICLE_STATUSES,
} from "@/features/vehicle/utils/vehicle-input";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { firstFieldErrors } from "@/lib/validation";

const selectClassName = cn(
  "h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none",
  "transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
  "aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20",
);

type FormErrors = Partial<Record<keyof VehicleFormValues, string>>;
type TextKey = Exclude<keyof VehicleFormValues, "condition" | "status" | "office_uuid">;

type VehicleFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** null to declare a new vehicle. */
  editing: Vehicle | null;
  /** Offices of the company that can manage the vehicle. */
  offices: Office[];
  /** Called after a successful save, before the dialog closes. */
  onSaved: () => Promise<void>;
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="grid gap-3">
      <h3 className="border-b pb-1 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
        {title}
      </h3>
      <div className="grid gap-3 sm:grid-cols-3">{children}</div>
    </section>
  );
}

export function VehicleFormDialog({
  open,
  onOpenChange,
  editing,
  offices,
  onSaved,
}: VehicleFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        {/* The popup unmounts when closed, so every opening starts from a fresh form. */}
        <VehicleForm
          key={editing?.id ?? "new"}
          editing={editing}
          offices={offices}
          onSaved={onSaved}
          onClose={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}

function VehicleForm({
  editing,
  offices,
  onSaved,
  onClose,
}: Omit<VehicleFormDialogProps, "open" | "onOpenChange"> & { onClose: () => void }) {
  const [form, setForm] = useState<VehicleFormValues>(() =>
    editing ? toVehicleInput(editing) : emptyVehicleInput(),
  );
  const [errors, setErrors] = useState<FormErrors>({});
  const [pending, setPending] = useState(false);

  // Inactive offices cannot be picked, but the one already assigned stays visible.
  const officeOptions = useMemo(
    () =>
      offices.filter(
        (office) => office.is_active || office.id === editing?.office_uuid,
      ),
    [offices, editing?.office_uuid],
  );

  function updateField<K extends keyof VehicleFormValues>(
    key: K,
    value: VehicleFormValues[K],
  ) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function textField(
    key: TextKey,
    label: string,
    options: { type?: "number" | "date"; placeholder?: string; upper?: boolean } = {},
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
          aria-invalid={Boolean(errors[key])}
          onChange={(event) =>
            updateField(
              key,
              options.upper ? event.target.value.toUpperCase() : event.target.value,
            )
          }
        />
        {errors[key] ? <FieldError>{errors[key]}</FieldError> : null}
      </Field>
    );
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const parsed = vehicleSchema.safeParse(form);
    if (!parsed.success) {
      setErrors(firstFieldErrors(parsed.error));
      return;
    }
    const payload = parsed.data;

    setPending(true);
    setErrors({});
    try {
      if (editing) {
        await updateVehicle(editing.id, payload);
        toast.success("Đã cập nhật phương tiện.", payload.license_plate);
      } else {
        await createVehicle(payload);
        toast.success("Đã thêm phương tiện.", payload.license_plate);
      }
      await onSaved();
      onClose();
    } catch (error: unknown) {
      toast.fromError(error, "Không lưu được phương tiện. Vui lòng thử lại.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-5">
      <DialogHeader>
        <DialogTitle>{editing ? "Sửa phương tiện" : "Khai báo phương tiện"}</DialogTitle>
        <DialogDescription>Biển số xe không được trùng trong cùng nhà xe.</DialogDescription>
      </DialogHeader>

      <FieldGroup className="gap-5">
        <Section title="Thông tin định danh">
          {textField("license_plate", "Biển số xe", { upper: true, placeholder: "51B-123.45" })}
          {textField("engine_number", "Số máy")}
          {textField("chassis_number", "Số khung")}
        </Section>

        <Section title="Thông số kỹ thuật">
          {textField("seat_count", "Số chỗ", { type: "number" })}
          {textField("model_code", "Số loại")}
          {textField("vehicle_kind", "Loại xe")}
          {textField("color", "Màu sơn")}
          {textField("payload", "Khối lượng toàn bộ (kg)", { type: "number" })}
          {textField("initial_odometer", "Công tơ mét ban đầu (km)", { type: "number" })}
        </Section>

        <Section title="Nguồn gốc sở hữu">
          {textField("brand", "Nhãn hiệu")}
          {textField("manufacture_year", "Năm sản xuất", { type: "number" })}
          {textField("manufacture_country", "Nước sản xuất")}
          {textField("service_life_year", "Niên hạn (năm)", { type: "number" })}
          {textField("owner_name", "Tên chủ xe")}
          {textField("registration_date", "Ngày đăng ký", { type: "date" })}
          <Field>
            <FieldLabel htmlFor="vehicle-office_uuid">Chi nhánh quản lý</FieldLabel>
            <select
              id="vehicle-office_uuid"
              value={form.office_uuid}
              onChange={(event) => updateField("office_uuid", event.target.value)}
              className={selectClassName}
              aria-invalid={Boolean(errors.office_uuid) || undefined}
            >
              <option value="">— Chọn chi nhánh —</option>
              {officeOptions.map((office) => (
                <option key={office.id} value={office.id}>
                  {office.is_active ? office.name : `${office.name} (ngưng hoạt động)`}
                </option>
              ))}
            </select>
            {errors.office_uuid ? <FieldError>{errors.office_uuid}</FieldError> : null}
          </Field>
        </Section>

        <Section title="Tình trạng sử dụng">
          <Field>
            <FieldLabel htmlFor="vehicle-condition">Tình trạng xe</FieldLabel>
            <select
              id="vehicle-condition"
              value={form.condition}
              onChange={(event) =>
                updateField("condition", event.target.value as VehicleFormValues["condition"])
              }
              className={selectClassName}
            >
              {VEHICLE_CONDITIONS.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
            {errors.condition ? <FieldError>{errors.condition}</FieldError> : null}
          </Field>
          <Field>
            <FieldLabel htmlFor="vehicle-status">Trạng thái</FieldLabel>
            <select
              id="vehicle-status"
              value={form.status}
              onChange={(event) =>
                updateField("status", event.target.value as VehicleFormValues["status"])
              }
              className={selectClassName}
            >
              {VEHICLE_STATUSES.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
            {errors.status ? <FieldError>{errors.status}</FieldError> : null}
          </Field>
        </Section>
      </FieldGroup>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose}>
          Hủy
        </Button>
        <Button type="submit" disabled={pending}>
          {pending ? "Đang lưu..." : editing ? "Cập nhật" : "Thêm mới"}
        </Button>
      </DialogFooter>
    </form>
  );
}
