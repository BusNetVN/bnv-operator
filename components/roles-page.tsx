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
  activePermissionCatalog,
  listPermissionCatalog,
  type PermissionGroup,
} from "@/lib/permissions";
import {
  createRole,
  deleteRole,
  emptyRoleInput,
  groupedRolePermissions,
  listRoles,
  statusLabel,
  toRoleInput,
  toRolePayload,
  updateRole,
  type Role,
  type RoleInput,
} from "@/lib/roles";
import { toast } from "@/lib/toast";

type FormErrors = Partial<Record<keyof RoleInput, string>>;

export function RoleGroupsPage() {
  const [companyUuid, setCompanyUuid] = useState<string | null>(null);
  const [catalog, setCatalog] = useState<PermissionGroup[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Role | null>(null);
  const [form, setForm] = useState<RoleInput>(emptyRoleInput);
  const [errors, setErrors] = useState<FormErrors>({});
  const [deleting, setDeleting] = useState<Role | null>(null);
  const [pending, setPending] = useState(false);

  const availableCatalog = useMemo(
    () => activePermissionCatalog(catalog),
    [catalog],
  );

  async function refresh(companyId: string) {
    const [nextRoles, nextCatalog] = await Promise.all([
      listRoles(companyId),
      listPermissionCatalog(),
    ]);
    setRoles(nextRoles);
    setCatalog(nextCatalog);
  }

  useEffect(() => {
    const account = getAccount();
    const companyId = account?.company_uuid ?? null;
    setCompanyUuid(companyId);

    if (!companyId) {
      setLoading(false);
      toast.warning(
        "Tài khoản chưa gắn với nhà xe.",
        "Chưa khai báo được nhóm quyền.",
      );
      return;
    }

    refresh(companyId)
      .catch((error: unknown) => {
        toast.fromError(error, "Không tải được danh sách nhóm quyền.");
      })
      .finally(() => setLoading(false));
  }, []);

  const filteredRoles = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    if (!keyword) {
      return roles;
    }

    return roles.filter((role) =>
      [
        role.name,
        role.description,
        ...role.permissions.flatMap((item) => [
          item.name,
          item.code,
          item.group?.name ?? "",
        ]),
      ]
        .join(" ")
        .toLowerCase()
        .includes(keyword),
    );
  }, [query, roles]);

  function updateField<K extends keyof RoleInput>(
    key: K,
    value: RoleInput[K],
  ) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function openCreate() {
    setEditing(null);
    setForm(emptyRoleInput());
    setErrors({});
    setFormOpen(true);
  }

  function openEdit(role: Role) {
    setEditing(role);
    setForm(toRoleInput(role));
    setErrors({});
    setFormOpen(true);
  }

  function togglePermission(id: string) {
    const selected = new Set(form.permission_ids);
    if (selected.has(id)) {
      selected.delete(id);
    } else {
      selected.add(id);
    }
    updateField("permission_ids", [...selected]);
  }

  function toggleGroup(group: PermissionGroup) {
    const ids = group.permissions.map((item) => item.id);
    const selected = new Set(form.permission_ids);
    const allSelected = ids.every((id) => selected.has(id));

    if (allSelected) {
      ids.forEach((id) => selected.delete(id));
    } else {
      ids.forEach((id) => selected.add(id));
    }

    updateField("permission_ids", [...selected]);
  }

  function validate(values: RoleInput): FormErrors {
    const nextErrors: FormErrors = {};
    const name = values.name.trim();

    if (!name) {
      nextErrors.name = "Vui lòng nhập tên nhóm quyền.";
    } else {
      const duplicated = roles.some(
        (role) =>
          role.name.trim().toLowerCase() === name.toLowerCase() &&
          role.id !== editing?.id,
      );
      if (duplicated) {
        nextErrors.name = "Tên nhóm quyền đã tồn tại.";
      }
    }

    if (values.permission_ids.length === 0) {
      nextErrors.permission_ids = "Vui lòng chọn ít nhất một chức năng.";
    }

    return nextErrors;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!companyUuid) {
      return;
    }

    const nextErrors = validate(form);
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      return;
    }

    const payload = toRolePayload(form);
    setPending(true);
    setErrors({});

    try {
      if (editing) {
        await updateRole(editing.id, payload);
        toast.success("Đã cập nhật nhóm quyền.", payload.name);
      } else {
        await createRole(companyUuid, payload);
        toast.success("Đã thêm nhóm quyền.", payload.name);
      }
      await refresh(companyUuid);
      setFormOpen(false);
    } catch (error: unknown) {
      toast.fromError(error, "Không lưu được nhóm quyền. Vui lòng thử lại.");
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
      await deleteRole(deleting.id);
      await refresh(companyUuid);
      toast.success("Đã xóa nhóm quyền.", deleting.name);
      setDeleting(null);
    } catch (error: unknown) {
      toast.fromError(error, "Không xóa được nhóm quyền. Vui lòng thử lại.");
      setDeleting(null);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-800">
          Nhóm quyền
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Nhà xe tạo nhóm quyền bằng cách chọn các chức năng do hệ thống cung
          cấp sẵn.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative min-w-0 flex-1 max-w-sm">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Tìm tên nhóm hoặc chức năng..."
            className="pl-8"
          />
        </div>
        <Button
          onClick={openCreate}
          disabled={!companyUuid || availableCatalog.length === 0}
          className="shrink-0"
        >
          <PlusIcon />
          Thêm nhóm quyền
        </Button>
      </div>

      <div className="overflow-hidden rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tên nhóm quyền</TableHead>
              <TableHead>Chức năng</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead className="w-24 text-right">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="h-24 text-center text-muted-foreground"
                >
                  Đang tải danh sách nhóm quyền...
                </TableCell>
              </TableRow>
            ) : filteredRoles.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="h-24 text-center text-muted-foreground"
                >
                  {roles.length === 0
                    ? availableCatalog.length === 0
                      ? "Chưa có chức năng do hệ thống cung cấp. Liên hệ quản trị để khai báo chức năng trước."
                      : "Chưa có nhóm quyền nào. Bấm Thêm nhóm quyền để khai báo."
                    : "Không tìm thấy nhóm quyền phù hợp."}
                </TableCell>
              </TableRow>
            ) : (
              filteredRoles.map((role) => (
                <TableRow key={role.id}>
                  <TableCell>
                    <p className="font-medium">{role.name}</p>
                    {role.description ? (
                      <p className="max-w-72 truncate text-sm text-muted-foreground">
                        {role.description}
                      </p>
                    ) : null}
                  </TableCell>
                  <TableCell className="max-w-xl">
                    <div className="flex flex-col gap-1">
                      {groupedRolePermissions(role).map((group) => (
                        <p key={group.code || group.name} className="text-sm">
                          <span className="font-medium">{group.name}:</span>{" "}
                          <span className="text-muted-foreground">
                            {group.permissions.map((item) => item.name).join(", ")}
                          </span>
                        </p>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell
                    className={
                      role.status ? "text-emerald-700" : "text-muted-foreground"
                    }
                  >
                    {statusLabel(role.status)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => openEdit(role)}
                      >
                        <PencilIcon />
                        <span className="sr-only">Sửa {role.name}</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => setDeleting(role)}
                      >
                        <Trash2Icon />
                        <span className="sr-only">Xóa {role.name}</span>
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
                {editing ? "Sửa nhóm quyền" : "Thêm nhóm quyền"}
              </DialogTitle>
              <DialogDescription>
                Chọn các chức năng có sẵn để gán cho nhóm quyền của nhà xe.
              </DialogDescription>
            </DialogHeader>

            <FieldGroup className="gap-4">
              <Field>
                <FieldLabel htmlFor="role-name">Tên nhóm quyền</FieldLabel>
                <Input
                  id="role-name"
                  value={form.name}
                  onChange={(event) => updateField("name", event.target.value)}
                  placeholder="Điều hành"
                  aria-invalid={Boolean(errors.name)}
                />
                {errors.name ? <FieldError>{errors.name}</FieldError> : null}
              </Field>

              <Field>
                <FieldLabel htmlFor="role-description">Mô tả</FieldLabel>
                <Textarea
                  id="role-description"
                  value={form.description}
                  onChange={(event) =>
                    updateField("description", event.target.value)
                  }
                  placeholder="Nhóm quyền cho nhân viên điều hành bán vé"
                />
              </Field>

              <Field orientation="horizontal" className="items-center gap-2">
                <Checkbox
                  id="role-status"
                  checked={form.status}
                  onCheckedChange={(checked) =>
                    updateField("status", checked === true)
                  }
                />
                <FieldLabel htmlFor="role-status" className="font-normal">
                  Đang hoạt động
                </FieldLabel>
              </Field>

              <Field>
                <FieldLabel>Chức năng</FieldLabel>
                {availableCatalog.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Chưa có chức năng do hệ thống cung cấp.
                  </p>
                ) : (
                  <div className="grid gap-3 rounded-lg border p-3">
                    {availableCatalog.map((group) => {
                      const ids = group.permissions.map((item) => item.id);
                      const selectedCount = ids.filter((id) =>
                        form.permission_ids.includes(id),
                      ).length;
                      const allSelected =
                        ids.length > 0 && selectedCount === ids.length;

                      return (
                        <div key={group.id} className="grid gap-2">
                          <label className="flex items-center gap-2 text-sm font-medium">
                            <Checkbox
                              checked={allSelected}
                              onCheckedChange={() => toggleGroup(group)}
                              aria-label={`Chọn tất cả chức năng ${group.name}`}
                            />
                            <span>{group.name}</span>
                            <span className="font-mono text-xs font-normal uppercase text-muted-foreground">
                              {group.code}
                            </span>
                          </label>
                          <div className="grid gap-2 border-l pl-5">
                            {group.permissions.map((item) => (
                              <label
                                key={item.id}
                                className="flex items-center gap-2 text-sm"
                              >
                                <Checkbox
                                  checked={form.permission_ids.includes(item.id)}
                                  onCheckedChange={() => togglePermission(item.id)}
                                />
                                <span>{item.name}</span>
                                <span className="font-mono text-xs text-muted-foreground">
                                  {item.code}
                                </span>
                              </label>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
                {errors.permission_ids ? (
                  <FieldError>{errors.permission_ids}</FieldError>
                ) : null}
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
            <AlertDialogTitle>Xóa nhóm quyền?</AlertDialogTitle>
            <AlertDialogDescription>
              Nhóm quyền {deleting?.name} sẽ bị xóa khỏi nhà xe.
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
