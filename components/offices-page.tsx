"use client";

import { useEffect, useMemo, useState } from "react";
import {
  PencilIcon,
  PlusIcon,
  SearchIcon,
  Trash2Icon,
} from "lucide-react";
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
import {
  Field,
  FieldDescription,
  FieldError,
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
  createOffice,
  deleteOffice,
  emptyOfficeInput,
  listOffices,
  toOfficeInput,
  updateOffice,
  type Office,
  type OfficeInput,
} from "@/lib/offices";
import { toast } from "@/lib/toast";

const OFFICE_CODE_PATTERN = /^[A-Z0-9]+(?:[._-]?[A-Z0-9]+)*$/;

type FormErrors = Partial<Record<keyof OfficeInput, string>>;

function isPhone(value: string) {
  const digits = value.replace(/\D/g, "");
  return digits.length >= 8 && digits.length <= 15;
}

function validateOffice(form: OfficeInput): FormErrors {
  const errors: FormErrors = {};
  const officeCode = form.office_code.trim().toUpperCase();
  const phones = form.phones.map((phone) => phone.trim()).filter(Boolean);

  if (!officeCode) {
    errors.office_code = "Vui lòng nhập mã văn phòng.";
  } else if (!OFFICE_CODE_PATTERN.test(officeCode)) {
    errors.office_code =
      "Mã văn phòng chỉ gồm chữ in hoa, số, dấu chấm, gạch ngang hoặc gạch dưới.";
  }

  if (!form.name.trim()) {
    errors.name = "Vui lòng nhập tên văn phòng.";
  }

  if (!form.address.trim()) {
    errors.address = "Vui lòng nhập địa chỉ văn phòng.";
  }

  if (!phones.length) {
    errors.phones = "Vui lòng nhập ít nhất một số điện thoại.";
  } else if (phones.some((phone) => !isPhone(phone))) {
    errors.phones = "Số điện thoại không hợp lệ.";
  }

  return errors;
}

export function OfficesPage() {
  const [companyUuid, setCompanyUuid] = useState<string | null>(null);
  const [offices, setOffices] = useState<Office[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Office | null>(null);
  const [form, setForm] = useState<OfficeInput>(emptyOfficeInput);
  const [errors, setErrors] = useState<FormErrors>({});
  const [deleting, setDeleting] = useState<Office | null>(null);
  const [pending, setPending] = useState(false);

  async function refresh(companyId: string) {
    const data = await listOffices(companyId);
    setOffices(data);
  }

  useEffect(() => {
    const account = getAccount();
    const companyId = account?.company_uuid ?? null;
    setCompanyUuid(companyId);

    if (!companyId) {
      setLoading(false);
      toast.warning(
        "Tài khoản chưa gắn với nhà xe.",
        "Chưa khai báo được văn phòng.",
      );
      return;
    }

    refresh(companyId)
      .catch((error: unknown) => {
        toast.fromError(error, "Không tải được danh sách văn phòng.");
      })
      .finally(() => setLoading(false));
  }, []);

  const filteredOffices = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    if (!keyword) {
      return offices;
    }

    return offices.filter((office) =>
      [office.office_code, office.name, office.address, office.note, ...office.phones]
        .join(" ")
        .toLowerCase()
        .includes(keyword),
    );
  }, [offices, query]);

  function updateField<K extends keyof OfficeInput>(
    key: K,
    value: OfficeInput[K],
  ) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function openCreate() {
    setEditing(null);
    setForm(emptyOfficeInput());
    setErrors({});
    setFormOpen(true);
  }

  function openEdit(office: Office) {
    setEditing(office);
    setForm(toOfficeInput(office));
    setErrors({});
    setFormOpen(true);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!companyUuid) {
      return;
    }

    const nextErrors = validateOffice(form);
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      return;
    }

    const payload: OfficeInput = {
      office_code: form.office_code.trim().toUpperCase(),
      name: form.name.trim(),
      address: form.address.trim(),
      phones: [...new Set(form.phones.map((phone) => phone.trim()).filter(Boolean))],
      note: form.note.trim(),
    };

    setPending(true);
    setErrors({});

    try {
      if (editing) {
        await updateOffice(editing.id, payload);
        toast.success("Đã cập nhật văn phòng.", payload.name);
      } else {
        await createOffice(companyUuid, payload);
        toast.success("Đã thêm văn phòng.", payload.name);
      }
      await refresh(companyUuid);
      setFormOpen(false);
    } catch (error: unknown) {
      toast.fromError(error, "Không lưu được văn phòng. Vui lòng thử lại.");
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
      await deleteOffice(deleting.id);
      await refresh(companyUuid);
      toast.success("Đã xóa văn phòng.", deleting.name);
      setDeleting(null);
    } catch (error: unknown) {
      toast.fromError(error, "Không xóa được văn phòng. Vui lòng thử lại.");
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
            Văn phòng
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Khai báo văn phòng nhà xe: mã, tên, địa chỉ, số điện thoại và ghi chú.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative min-w-0 flex-1 max-w-sm">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Tìm mã, tên, địa chỉ, số điện thoại..."
            className="pl-8"
          />
        </div>
        <Button onClick={openCreate} disabled={!companyUuid}>
          <PlusIcon />
          Thêm văn phòng
        </Button>
      </div>

      <div className="overflow-hidden rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Mã văn phòng</TableHead>
              <TableHead>Tên văn phòng</TableHead>
              <TableHead>Địa chỉ</TableHead>
              <TableHead>Số điện thoại</TableHead>
              <TableHead>Ghi chú</TableHead>
              <TableHead className="w-24 text-right">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  Đang tải danh sách văn phòng...
                </TableCell>
              </TableRow>
            ) : filteredOffices.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  {offices.length === 0
                    ? "Chưa có văn phòng nào. Bấm Thêm văn phòng để khai báo."
                    : "Không tìm thấy văn phòng phù hợp."}
                </TableCell>
              </TableRow>
            ) : (
              filteredOffices.map((office) => (
                <TableRow key={office.id}>
                  <TableCell className="font-medium uppercase">
                    {office.office_code}
                  </TableCell>
                  <TableCell>{office.name}</TableCell>
                  <TableCell className="max-w-72 truncate" title={office.address}>
                    {office.address}
                  </TableCell>
                  <TableCell className="max-w-56 truncate" title={office.phones.join(", ")}>
                    {office.phones.join(", ")}
                  </TableCell>
                  <TableCell className="max-w-56 truncate text-muted-foreground">
                    {office.note || "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => openEdit(office)}
                      >
                        <PencilIcon />
                        <span className="sr-only">Sửa {office.name}</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => setDeleting(office)}
                      >
                        <Trash2Icon />
                        <span className="sr-only">Xóa {office.name}</span>
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
                {editing ? "Sửa văn phòng" : "Thêm văn phòng"}
              </DialogTitle>
              <DialogDescription>
                Số điện thoại có thể thêm nhiều số. Mã văn phòng không trùng trong cùng nhà xe.
              </DialogDescription>
            </DialogHeader>

            <FieldGroup className="gap-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="office-code">Mã văn phòng</FieldLabel>
                  <Input
                    id="office-code"
                    value={form.office_code}
                    onChange={(event) =>
                      updateField("office_code", event.target.value.toUpperCase())
                    }
                    placeholder="VP-HCM"
                    className="uppercase"
                    aria-invalid={Boolean(errors.office_code)}
                  />
                  {errors.office_code ? (
                    <FieldError>{errors.office_code}</FieldError>
                  ) : null}
                </Field>
                <Field>
                  <FieldLabel htmlFor="office-name">Tên văn phòng</FieldLabel>
                  <Input
                    id="office-name"
                    value={form.name}
                    onChange={(event) => updateField("name", event.target.value)}
                    placeholder="Văn phòng Hồ Chí Minh"
                    aria-invalid={Boolean(errors.name)}
                  />
                  {errors.name ? <FieldError>{errors.name}</FieldError> : null}
                </Field>
              </div>

              <Field>
                <FieldLabel htmlFor="office-address">Địa chỉ</FieldLabel>
                <Textarea
                  id="office-address"
                  value={form.address}
                  onChange={(event) => updateField("address", event.target.value)}
                  placeholder="265 Cô Giang, Quận 1, TP. Hồ Chí Minh"
                  aria-invalid={Boolean(errors.address)}
                />
                {errors.address ? <FieldError>{errors.address}</FieldError> : null}
              </Field>

              <Field>
                <FieldLabel>Số điện thoại</FieldLabel>
                <FieldDescription>
                  Nhập một hoặc nhiều số điện thoại của văn phòng.
                </FieldDescription>
                <div className="flex flex-col gap-2">
                  {form.phones.map((phone, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        value={phone}
                        onChange={(event) => {
                          const next = [...form.phones];
                          next[index] = event.target.value;
                          updateField("phones", next);
                        }}
                        placeholder="028 3838 6868"
                        aria-invalid={Boolean(errors.phones)}
                      />
                      {form.phones.length > 1 ? (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() =>
                            updateField(
                              "phones",
                              form.phones.filter((_, phoneIndex) => phoneIndex !== index),
                            )
                          }
                        >
                          Xóa
                        </Button>
                      ) : null}
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    className="w-fit"
                    onClick={() => updateField("phones", [...form.phones, ""])}
                  >
                    Thêm số điện thoại
                  </Button>
                </div>
                {errors.phones ? <FieldError>{errors.phones}</FieldError> : null}
              </Field>

              <Field>
                <FieldLabel htmlFor="office-note">Ghi chú</FieldLabel>
                <Textarea
                  id="office-note"
                  value={form.note}
                  onChange={(event) => updateField("note", event.target.value)}
                  placeholder="Giờ làm việc, ghi chú nội bộ..."
                />
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
            <AlertDialogTitle>Xóa văn phòng?</AlertDialogTitle>
            <AlertDialogDescription>
              Văn phòng {deleting?.name} sẽ bị xóa khỏi hệ thống.
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
