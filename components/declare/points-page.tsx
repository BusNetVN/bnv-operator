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
import { Textarea } from "@/components/ui/textarea";
import { useAuthStore } from "@/features/auth/stores/auth.store";
import type { Province, Ward } from "@/types/locations";
import { locationAddress } from "@/lib/locations";
import { listProvinces, listWards } from "@/service/locations";
import type { Point, PointInput } from "@/types/points";
import { emptyPointInput, POINT_TYPES, pointTypeLabel, toPointInput } from "@/lib/points";
import { createPoint, deletePoint, listPoints, updatePoint } from "@/service/points";
import { toast } from "@/lib/toast";

type FormErrors = Partial<Record<keyof PointInput, string>>;

function validatePoint(form: PointInput): FormErrors {
  const errors: FormErrors = {};
  if (!form.name.trim()) {
    errors.name = "Vui lòng nhập tên điểm dừng.";
  }
  if (!form.point_type) {
    errors.point_type = "Vui lòng chọn loại điểm.";
  }
  return errors;
}

export function PointsPage() {
  const [companyUuid, setCompanyUuid] = useState<string | null>(null);
  const [points, setPoints] = useState<Point[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Point | null>(null);
  const [form, setForm] = useState<PointInput>(emptyPointInput);
  const [errors, setErrors] = useState<FormErrors>({});
  const [deleting, setDeleting] = useState<Point | null>(null);
  const [pending, setPending] = useState(false);
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);
  const [wardsLoading, setWardsLoading] = useState(false);

  async function refresh(companyId: string) {
    setPoints(await listPoints(companyId));
  }

  useEffect(() => {
    const account = useAuthStore.getState().account;
    const companyId = account?.company_uuid ?? null;
    setCompanyUuid(companyId);
    if (!companyId) {
      setLoading(false);
      toast.warning(
        "Tài khoản chưa gắn với nhà xe.",
        "Chưa khai báo được điểm dừng.",
      );
      return;
    }

    refresh(companyId)
      .catch((error: unknown) => {
        toast.fromError(error, "Không tải được danh sách điểm dừng.");
      })
      .finally(() => setLoading(false));

    listProvinces()
      .then(setProvinces)
      .catch((error: unknown) => {
        toast.fromError(error, "Không tải được danh sách tỉnh/thành.");
      });
  }, []);

  useEffect(() => {
    if (!formOpen || !form.province_uuid) {
      setWards([]);
      return;
    }

    let cancelled = false;
    setWardsLoading(true);
    listWards(form.province_uuid)
      .then((items) => {
        if (!cancelled) {
          setWards(items);
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setWards([]);
          toast.fromError(error, "Không tải được danh sách xã/phường.");
        }
      })
      .finally(() => {
        if (!cancelled) {
          setWardsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [form.province_uuid, formOpen]);

  const filteredPoints = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    if (!keyword) {
      return points;
    }
    return points.filter((point) =>
      [
        point.point_code,
        point.name,
        pointTypeLabel(point.point_type),
        point.address,
        point.ward_name,
        point.province_name,
        point.note,
      ]
        .join(" ")
        .toLowerCase()
        .includes(keyword),
    );
  }, [points, query]);

  function updateField<K extends keyof PointInput>(
    key: K,
    value: PointInput[K],
  ) {
    setForm((current) => {
      if (key === "province_uuid" && current.province_uuid !== value) {
        return { ...current, province_uuid: String(value), ward_uuid: "" };
      }
      return { ...current, [key]: value };
    });
  }

  function openCreate() {
    setEditing(null);
    setForm(emptyPointInput());
    setErrors({});
    setFormOpen(true);
  }

  function openEdit(point: Point) {
    if (point.shared) {
      return;
    }
    setEditing(point);
    setForm(toPointInput(point));
    setErrors({});
    setFormOpen(true);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!companyUuid) {
      return;
    }
    const nextErrors = validatePoint(form);
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      return;
    }

    const payload: PointInput = {
      point_code: form.point_code.trim().toUpperCase(),
      name: form.name.trim(),
      point_type: form.point_type,
      province_uuid: form.province_uuid,
      ward_uuid: form.ward_uuid,
      address: form.address.trim(),
      note: form.note.trim(),
      status: form.status,
    };

    setPending(true);
    setErrors({});
    try {
      if (editing) {
        await updatePoint(editing.id, payload);
        toast.success("Đã cập nhật điểm dừng.", payload.name);
      } else {
        await createPoint(companyUuid, payload);
        toast.success("Đã thêm điểm dừng.", payload.name);
      }
      await refresh(companyUuid);
      setFormOpen(false);
    } catch (error: unknown) {
      toast.fromError(error, "Không lưu được điểm dừng. Vui lòng thử lại.");
    } finally {
      setPending(false);
    }
  }

  async function handleDelete() {
    if (!deleting || !companyUuid || deleting.shared) {
      return;
    }
    setPending(true);
    try {
      await deletePoint(deleting.id);
      await refresh(companyUuid);
      toast.success("Đã xóa điểm dừng.", deleting.name);
      setDeleting(null);
    } catch (error: unknown) {
      toast.fromError(error, "Không xóa được điểm dừng. Vui lòng thử lại.");
      setDeleting(null);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-800">
          Điểm dừng
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Điểm dùng chung do hệ thống khai báo. Điểm do nhà xe thêm chỉ nhà xe
          này dùng được.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative min-w-0 max-w-sm flex-1">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Tìm mã, tên, địa chỉ..."
            className="pl-8"
          />
        </div>
        <Button onClick={openCreate} disabled={!companyUuid}>
          <PlusIcon />
          Thêm điểm dừng
        </Button>
      </div>

      <div className="overflow-hidden rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Mã</TableHead>
              <TableHead>Tên điểm dừng</TableHead>
              <TableHead>Loại điểm</TableHead>
              <TableHead>Địa chỉ</TableHead>
              <TableHead>Phạm vi</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead className="w-24 text-right">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="h-24 text-center text-muted-foreground"
                >
                  Đang tải danh sách điểm dừng...
                </TableCell>
              </TableRow>
            ) : filteredPoints.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="h-24 text-center text-muted-foreground"
                >
                  {points.length === 0
                    ? "Chưa có điểm dừng. Bấm Thêm điểm dừng để khai báo."
                    : "Không tìm thấy điểm dừng phù hợp."}
                </TableCell>
              </TableRow>
            ) : (
              filteredPoints.map((point) => (
                <TableRow key={point.id}>
                  <TableCell className="font-medium uppercase">
                    {point.point_code}
                  </TableCell>
                  <TableCell>{point.name}</TableCell>
                  <TableCell>{pointTypeLabel(point.point_type)}</TableCell>
                  <TableCell
                    className="max-w-72 truncate"
                    title={locationAddress(
                      point.address,
                      point.ward_name,
                      point.province_name,
                    )}
                  >
                    {locationAddress(
                      point.address,
                      point.ward_name,
                      point.province_name,
                    ) || "—"}
                  </TableCell>
                  <TableCell>
                    {point.shared ? "Hệ thống" : "Nhà xe"}
                  </TableCell>
                  <TableCell
                    className={
                      point.status ? "text-emerald-700" : "text-muted-foreground"
                    }
                  >
                    {point.status ? "Hoạt động" : "Ngưng"}
                  </TableCell>
                  <TableCell className="text-right">
                    {point.shared ? (
                      <span className="text-xs text-muted-foreground">
                        Chỉ xem
                      </span>
                    ) : (
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => openEdit(point)}
                        >
                          <PencilIcon />
                          <span className="sr-only">Sửa {point.name}</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => setDeleting(point)}
                        >
                          <Trash2Icon />
                          <span className="sr-only">Xóa {point.name}</span>
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="overflow-visible sm:max-w-lg">
          <form onSubmit={handleSubmit} className="grid gap-4">
            <DialogHeader>
              <DialogTitle>
                {editing ? "Sửa điểm dừng" : "Thêm điểm dừng"}
              </DialogTitle>
              <DialogDescription>
                Điểm này chỉ nhà xe của bạn sử dụng được.
              </DialogDescription>
            </DialogHeader>
            <FieldGroup className="gap-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="point-code">Mã điểm dừng</FieldLabel>
                  <Input
                    id="point-code"
                    value={form.point_code}
                    onChange={(event) =>
                      updateField("point_code", event.target.value.toUpperCase())
                    }
                    placeholder="BX-HCM"
                    className="uppercase"
                    aria-invalid={Boolean(errors.point_code)}
                  />
                  {errors.point_code ? (
                    <FieldError>{errors.point_code}</FieldError>
                  ) : null}
                </Field>
                <Field>
                  <FieldLabel htmlFor="point-name">Tên điểm dừng</FieldLabel>
                  <Input
                    id="point-name"
                    value={form.name}
                    onChange={(event) => updateField("name", event.target.value)}
                    placeholder="Bến xe miền Đông"
                    aria-invalid={Boolean(errors.name)}
                  />
                  {errors.name ? <FieldError>{errors.name}</FieldError> : null}
                </Field>
              </div>
              <Field>
                <FieldLabel htmlFor="point-type">Loại điểm</FieldLabel>
                <SearchableSelect
                  id="point-type"
                  value={form.point_type}
                  items={POINT_TYPES.map((item) => ({
                    value: item.value,
                    label: item.label,
                    description: item.description,
                  }))}
                  onValueChange={(value) =>
                    updateField("point_type", value as PointInput["point_type"])
                  }
                  placeholder="Chọn loại điểm"
                  searchPlaceholder="Tìm loại điểm..."
                  invalid={Boolean(errors.point_type)}
                />
                {errors.point_type ? (
                  <FieldError>{errors.point_type}</FieldError>
                ) : null}
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="point-province">Tỉnh/thành</FieldLabel>
                  <SearchableSelect
                    id="point-province"
                    value={form.province_uuid}
                    items={provinces.map((province) => ({
                      value: province.id,
                      label: province.name,
                    }))}
                    onValueChange={(value) => updateField("province_uuid", value)}
                    placeholder="Chọn tỉnh/thành"
                    searchPlaceholder="Tìm tỉnh/thành..."
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="point-ward">Xã/phường</FieldLabel>
                  <SearchableSelect
                    id="point-ward"
                    value={form.ward_uuid}
                    items={wards.map((ward) => ({
                      value: ward.id,
                      label: ward.name,
                    }))}
                    onValueChange={(value) => updateField("ward_uuid", value)}
                    disabled={!form.province_uuid || wardsLoading}
                    placeholder={
                      !form.province_uuid
                        ? "Chọn tỉnh trước"
                        : wardsLoading
                          ? "Đang tải..."
                          : "Chọn xã/phường"
                    }
                    searchPlaceholder="Tìm xã/phường..."
                  />
                </Field>
              </div>
              <Field>
                <FieldLabel htmlFor="point-address">Địa chỉ chi tiết</FieldLabel>
                <Textarea
                  id="point-address"
                  value={form.address}
                  onChange={(event) =>
                    updateField("address", event.target.value)
                  }
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="point-note">Ghi chú</FieldLabel>
                <Textarea
                  id="point-note"
                  value={form.note}
                  onChange={(event) => updateField("note", event.target.value)}
                />
              </Field>
              <Field orientation="horizontal" className="items-center gap-2">
                <Checkbox
                  id="point-status"
                  checked={form.status}
                  onCheckedChange={(checked) =>
                    updateField("status", checked === true)
                  }
                />
                <FieldLabel htmlFor="point-status" className="font-normal">
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
            <AlertDialogTitle>Xóa điểm dừng?</AlertDialogTitle>
            <AlertDialogDescription>
              Điểm dừng {deleting?.name} sẽ bị xóa khỏi nhà xe.
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
