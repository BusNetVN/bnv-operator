"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronDownIcon,
  KeyRoundIcon,
  LockIcon,
  MoreHorizontalIcon,
  PencilIcon,
  PlusIcon,
  SearchIcon,
  Trash2Icon,
  UnlockIcon,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { Badge } from "@/components/ui/badge";
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
import { getAccount, getWorkspace } from "@/lib/auth-session";
import {
  companyUsernameSuffix,
  createStaff,
  deleteStaff,
  emptyStaffInput,
  listStaff,
  resetStaffPassword,
  setStaffStatus,
  STAFF_ROLES,
  staffRoleLabel,
  staffRoleNames,
  statusLabel,
  toStaffInput,
  updateStaff,
  USERNAME_MAX_LENGTH,
  usernameLocalPart,
  usernameWithCompany,
  type Staff,
  type StaffInput,
  type StaffRole,
} from "@/lib/staff";
import { listRoles, type Role } from "@/lib/roles";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";

const USERNAME_PATTERN = /^[a-z0-9]+(?:[._-]?[a-z0-9]+)*$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const selectClassName = cn(
  "h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none",
  "transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
  "disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50",
  "aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20",
);

type FormErrors = Partial<Record<keyof StaffInput, string>>;
type PasswordErrors = {
  password?: string;
  confirm_password?: string;
};
type ConfirmAction =
  | { kind: "delete"; staff: Staff }
  | { kind: "lock"; staff: Staff }
  | { kind: "unlock"; staff: Staff };

function confirmCopy(action: ConfirmAction) {
  const name = action.staff.full_name || action.staff.username;
  if (action.kind === "delete") {
    return {
      title: "Xóa nhân sự?",
      description: `Tài khoản ${name} sẽ bị xóa khỏi hệ thống.`,
      action: "Xóa",
      pending: "Đang xóa...",
      destructive: true,
    };
  }
  if (action.kind === "lock") {
    return {
      title: "Khóa tài khoản?",
      description: `Tài khoản ${name} sẽ không đăng nhập được cho đến khi được mở khóa.`,
      action: "Khóa",
      pending: "Đang khóa...",
      destructive: true,
    };
  }
  return {
    title: "Mở khóa tài khoản?",
    description: `Tài khoản ${name} sẽ đăng nhập được trở lại.`,
    action: "Mở khóa",
    pending: "Đang mở khóa...",
    destructive: false,
  };
}

function isPhone(value: string) {
  const digits = value.replace(/\D/g, "");
  return digits.length >= 8 && digits.length <= 15;
}

function validateStaff(
  form: StaffInput,
  isCreate: boolean,
  companyCode: string,
): FormErrors {
  const errors: FormErrors = {};
  const username = usernameLocalPart(form.username, companyCode);
  const fullUsername = usernameWithCompany(username, companyCode);
  const suffix = companyUsernameSuffix(companyCode);
  const email = form.email.trim().toLowerCase();
  const phone = form.phone.trim();
  const password = form.password;
  const confirmPassword = form.confirm_password;

  if (!form.full_name.trim()) {
    errors.full_name = "Vui lòng nhập họ tên.";
  }

  if (!username) {
    errors.username = "Vui lòng nhập tên đăng nhập.";
  } else if (!USERNAME_PATTERN.test(username)) {
    errors.username =
      "Tên đăng nhập chỉ gồm chữ thường, số, dấu chấm, gạch ngang hoặc gạch dưới.";
  } else if (fullUsername.length > USERNAME_MAX_LENGTH) {
    errors.username = `Tên đăng nhập tối đa ${USERNAME_MAX_LENGTH - suffix.length} ký tự trước hậu tố nhà xe.`;
  }

  if (!form.staff_role) {
    errors.staff_role = "Vui lòng chọn vai trò.";
  }

  if (email && !EMAIL_PATTERN.test(email)) {
    errors.email = "Email không hợp lệ.";
  }

  if (phone && !isPhone(phone)) {
    errors.phone = "Số điện thoại không hợp lệ.";
  }

  if (isCreate) {
    if (!password) {
      errors.password = "Vui lòng nhập mật khẩu.";
    } else if (password.length < 8) {
      errors.password = "Mật khẩu tối thiểu 8 ký tự.";
    }
  } else if (password && password.length < 8) {
    errors.password = "Mật khẩu tối thiểu 8 ký tự.";
  }

  if (password || confirmPassword) {
    if (password !== confirmPassword) {
      errors.confirm_password = "Xác nhận mật khẩu không khớp.";
    }
  }

  return errors;
}

export function StaffPage() {
  const [companyUuid, setCompanyUuid] = useState<string | null>(null);
  const [companyCode, setCompanyCode] = useState("");
  const [currentAccountId, setCurrentAccountId] = useState<string | null>(null);
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [roleOptions, setRoleOptions] = useState<Role[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [rolesOpen, setRolesOpen] = useState(false);
  const roleTriggerRef = useRef<HTMLDivElement>(null);
  const [editing, setEditing] = useState<Staff | null>(null);
  const [form, setForm] = useState<StaffInput>(emptyStaffInput);
  const [errors, setErrors] = useState<FormErrors>({});
  const [confirming, setConfirming] = useState<ConfirmAction | null>(null);
  const [passwordTarget, setPasswordTarget] = useState<Staff | null>(null);
  const [passwordForm, setPasswordForm] = useState({
    password: "",
    confirm_password: "",
  });
  const [passwordErrors, setPasswordErrors] = useState<PasswordErrors>({});
  const [pending, setPending] = useState(false);

  async function refresh(companyId: string) {
    const [data, roles] = await Promise.all([
      listStaff(companyId),
      listRoles(companyId),
    ]);
    setStaffList(data);
    setRoleOptions(roles);
  }

  useEffect(() => {
    const account = getAccount();
    const companyId = account?.company_uuid ?? null;
    setCompanyUuid(companyId);
    setCompanyCode(getWorkspace()?.company.company_code ?? "");
    setCurrentAccountId(account?.id ?? null);

    if (!companyId) {
      setLoading(false);
      toast.warning(
        "Tài khoản chưa gắn với nhà xe.",
        "Chưa khai báo được nhân sự.",
      );
      return;
    }

    refresh(companyId)
      .catch((error: unknown) => {
        toast.fromError(error, "Không tải được danh sách nhân sự.");
      })
      .finally(() => setLoading(false));
  }, []);

  const filteredStaff = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    if (!keyword) {
      return staffList;
    }

    return staffList.filter((staff) =>
      [
        staff.username,
        staff.full_name,
        staff.email,
        staff.phone,
        staffRoleLabel(staff.staff_role),
        staffRoleNames(staff),
        statusLabel(staff.status),
      ]
        .join(" ")
        .toLowerCase()
        .includes(keyword),
    );
  }, [staffList, query]);

  const selectableRoles = useMemo(() => {
    const assigned = new Set(form.role_ids);
    return roleOptions.filter((role) => role.status || assigned.has(role.id));
  }, [form.role_ids, roleOptions]);

  function updateField<K extends keyof StaffInput>(
    key: K,
    value: StaffInput[K],
  ) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  useEffect(() => {
    if (!formOpen) {
      setRolesOpen(false);
    }
  }, [formOpen]);

  useEffect(() => {
    if (!rolesOpen) {
      return;
    }

    function handlePointerDown(event: PointerEvent) {
      const target = event.target;
      if (!(target instanceof Node)) {
        return;
      }

      const onTrigger = roleTriggerRef.current?.contains(target);
      const onMenu =
        target instanceof Element &&
        target.closest("[data-staff-role-groups-menu]");

      if (!onTrigger && !onMenu) {
        setRolesOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown, true);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown, true);
    };
  }, [rolesOpen]);

  function toggleRole(id: string, checked: boolean) {
    const selected = new Set(form.role_ids);
    if (checked) {
      selected.add(id);
    } else {
      selected.delete(id);
    }
    updateField("role_ids", [...selected]);
  }

  function openCreate() {
    setEditing(null);
    setForm(emptyStaffInput());
    setErrors({});
    setFormOpen(true);
  }

  function openEdit(staff: Staff) {
    setEditing(staff);
    setForm(toStaffInput(staff, companyCode));
    setErrors({});
    setFormOpen(true);
  }

  function requestDelete(staff: Staff) {
    if (staff.id === currentAccountId) {
      toast.warning(
        "Không thể xóa tài khoản đang đăng nhập.",
        staff.full_name || staff.username,
      );
      return;
    }

    setConfirming({ kind: "delete", staff });
  }

  function requestLock(staff: Staff) {
    if (staff.id === currentAccountId) {
      toast.warning(
        "Không thể khóa tài khoản đang đăng nhập.",
        staff.full_name || staff.username,
      );
      return;
    }

    setConfirming({ kind: "lock", staff });
  }

  function requestUnlock(staff: Staff) {
    setConfirming({ kind: "unlock", staff });
  }

  function openPassword(staff: Staff) {
    setPasswordTarget(staff);
    setPasswordForm({ password: "", confirm_password: "" });
    setPasswordErrors({});
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!companyUuid) {
      return;
    }

    const nextErrors = validateStaff(form, !editing, companyCode);
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      return;
    }

    const payload: StaffInput = {
      username: usernameLocalPart(form.username, companyCode),
      password: form.password,
      confirm_password: form.confirm_password,
      full_name: form.full_name.trim(),
      email: form.email.trim().toLowerCase(),
      phone: form.phone.trim(),
      staff_role: form.staff_role,
      role_ids: form.role_ids,
      status: form.status,
    };

    setPending(true);
    setErrors({});

    try {
      if (editing) {
        await updateStaff(editing.id, payload, companyCode);
        toast.success("Đã cập nhật nhân sự.", payload.full_name || payload.username);
      } else {
        await createStaff(companyUuid, payload, companyCode);
        toast.success("Đã thêm nhân sự.", payload.full_name || payload.username);
      }
      await refresh(companyUuid);
      setFormOpen(false);
    } catch (error: unknown) {
      toast.fromError(error, "Không lưu được nhân sự. Vui lòng thử lại.");
    } finally {
      setPending(false);
    }
  }

  async function handleConfirmAction() {
    if (!confirming || !companyUuid) {
      return;
    }

    if (
      confirming.kind !== "unlock" &&
      confirming.staff.id === currentAccountId
    ) {
      toast.warning(
        confirming.kind === "delete"
          ? "Không thể xóa tài khoản đang đăng nhập."
          : "Không thể khóa tài khoản đang đăng nhập.",
      );
      setConfirming(null);
      return;
    }

    setPending(true);
    try {
      if (confirming.kind === "delete") {
        await deleteStaff(confirming.staff.id);
        toast.success(
          "Đã xóa nhân sự.",
          confirming.staff.full_name || confirming.staff.username,
        );
      } else if (confirming.kind === "lock") {
        await setStaffStatus(confirming.staff.id, false);
        toast.success(
          "Đã khóa tài khoản.",
          confirming.staff.full_name || confirming.staff.username,
        );
      } else {
        await setStaffStatus(confirming.staff.id, true);
        toast.success(
          "Đã mở khóa tài khoản.",
          confirming.staff.full_name || confirming.staff.username,
        );
      }
      await refresh(companyUuid);
      setConfirming(null);
    } catch (error: unknown) {
      const fallback =
        confirming.kind === "delete"
          ? "Không xóa được nhân sự. Vui lòng thử lại."
          : confirming.kind === "lock"
            ? "Không khóa được tài khoản. Vui lòng thử lại."
            : "Không mở khóa được tài khoản. Vui lòng thử lại.";
      toast.fromError(error, fallback);
      setConfirming(null);
    } finally {
      setPending(false);
    }
  }

  async function handleResetPassword(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!passwordTarget || !companyUuid) {
      return;
    }

    const nextErrors: PasswordErrors = {};
    if (!passwordForm.password) {
      nextErrors.password = "Vui lòng nhập mật khẩu mới.";
    } else if (passwordForm.password.length < 8) {
      nextErrors.password = "Mật khẩu tối thiểu 8 ký tự.";
    }
    if (!passwordForm.confirm_password) {
      nextErrors.confirm_password = "Vui lòng xác nhận mật khẩu mới.";
    } else if (passwordForm.confirm_password !== passwordForm.password) {
      nextErrors.confirm_password = "Xác nhận mật khẩu không khớp.";
    }

    if (Object.keys(nextErrors).length) {
      setPasswordErrors(nextErrors);
      return;
    }

    setPending(true);
    setPasswordErrors({});
    try {
      await resetStaffPassword(passwordTarget.id, passwordForm.password);
      toast.success(
        "Đã đổi mật khẩu.",
        passwordTarget.full_name || passwordTarget.username,
      );
      setPasswordTarget(null);
    } catch (error: unknown) {
      toast.fromError(error, "Không đổi được mật khẩu. Vui lòng thử lại.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-800">
            Nhân sự
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Khai báo điều hành, nhân viên, tài xế và phụ xe của nhà xe.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative min-w-0 flex-1 max-w-sm">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Tìm tên, tài khoản, vai trò, nhóm quyền..."
            className="pl-8"
          />
        </div>
        <Button onClick={openCreate} disabled={!companyUuid} className="shrink-0">
          <PlusIcon />
          Thêm nhân sự
        </Button>
      </div>

      <div className="overflow-x-auto rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Họ tên</TableHead>
              <TableHead>Tên đăng nhập</TableHead>
              <TableHead>Vai trò</TableHead>
              <TableHead>Nhóm quyền</TableHead>
              <TableHead>Số điện thoại</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead className="w-12 text-right">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                  Đang tải danh sách nhân sự...
                </TableCell>
              </TableRow>
            ) : filteredStaff.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                  {staffList.length === 0
                    ? "Chưa có nhân sự nào. Bấm Thêm nhân sự để khai báo."
                    : "Không tìm thấy nhân sự phù hợp."}
                </TableCell>
              </TableRow>
            ) : (
              filteredStaff.map((staff) => {
                const isCurrent = staff.id === currentAccountId;

                return (
                  <TableRow key={staff.id}>
                    <TableCell className="font-medium">
                      {staff.full_name || "—"}
                    </TableCell>
                    <TableCell>{staff.username}</TableCell>
                    <TableCell>{staffRoleLabel(staff.staff_role)}</TableCell>
                    <TableCell className="max-w-72">
                      {staff.roles?.length ? (
                        <div className="flex flex-wrap gap-1">
                          {staff.roles.map((role) => (
                            <Badge
                              key={role.id}
                              variant="secondary"
                              title={role.name}
                            >
                              {role.name}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell>{staff.phone || "—"}</TableCell>
                    <TableCell className="max-w-56 truncate" title={staff.email}>
                      {staff.email || "—"}
                    </TableCell>
                    <TableCell
                      className={
                        staff.status ? "text-emerald-700" : "text-muted-foreground"
                      }
                    >
                      {statusLabel(staff.status)}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          render={
                            <Button variant="ghost" size="icon-sm" />
                          }
                        >
                          <MoreHorizontalIcon />
                          <span className="sr-only">
                            Thao tác {staff.full_name || staff.username}
                          </span>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-auto min-w-44">
                          <DropdownMenuItem onClick={() => openEdit(staff)}>
                            <PencilIcon />
                            Sửa
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openPassword(staff)}>
                            <KeyRoundIcon />
                            Đổi mật khẩu
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => requestLock(staff)}
                            disabled={isCurrent || !staff.status}
                          >
                            <LockIcon />
                            Khóa tài khoản
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => requestUnlock(staff)}
                            disabled={staff.status}
                          >
                            <UnlockIcon />
                            Mở khóa tài khoản
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            variant="destructive"
                            onClick={() => requestDelete(staff)}
                            disabled={isCurrent}
                          >
                            <Trash2Icon />
                            Xóa
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <form onSubmit={handleSubmit} className="grid gap-4">
            <DialogHeader>
              <DialogTitle>
                {editing ? "Sửa nhân sự" : "Thêm nhân sự"}
              </DialogTitle>
              <DialogDescription>
                Tài khoản thuộc nhà xe hiện tại. Tên đăng nhập không được trùng.
              </DialogDescription>
            </DialogHeader>

            <FieldGroup className="gap-4">
              <Field>
                <FieldLabel htmlFor="staff-full-name">Họ tên</FieldLabel>
                <Input
                  id="staff-full-name"
                  value={form.full_name}
                  onChange={(event) => updateField("full_name", event.target.value)}
                  placeholder="Nguyễn Văn A"
                  aria-invalid={Boolean(errors.full_name)}
                />
                {errors.full_name ? <FieldError>{errors.full_name}</FieldError> : null}
              </Field>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="staff-username">Tên đăng nhập</FieldLabel>
                  <div
                    className={cn(
                      "flex min-w-0 overflow-hidden rounded-lg border border-input bg-transparent",
                      "focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50",
                      errors.username &&
                        "border-destructive ring-3 ring-destructive/20",
                    )}
                  >
                    <Input
                      id="staff-username"
                      value={form.username}
                      onChange={(event) =>
                        updateField(
                          "username",
                          usernameLocalPart(
                            event.target.value.toLowerCase(),
                            companyCode,
                          ),
                        )
                      }
                      placeholder="nguyenvana"
                      className="rounded-none border-0 lowercase shadow-none focus-visible:ring-0"
                      autoComplete="off"
                      aria-invalid={Boolean(errors.username)}
                    />
                    {companyUsernameSuffix(companyCode) ? (
                      <span className="inline-flex shrink-0 items-center border-l border-input bg-muted/40 px-2.5 text-sm text-muted-foreground lowercase">
                        {companyUsernameSuffix(companyCode)}
                      </span>
                    ) : null}
                  </div>
                  {errors.username ? <FieldError>{errors.username}</FieldError> : null}
                </Field>
                <Field>
                  <FieldLabel htmlFor="staff-role">Vai trò</FieldLabel>
                  <select
                    id="staff-role"
                    value={form.staff_role}
                    onChange={(event) =>
                      updateField("staff_role", event.target.value as StaffRole)
                    }
                    className={selectClassName}
                    aria-invalid={Boolean(errors.staff_role) || undefined}
                  >
                    {STAFF_ROLES.map((role) => (
                      <option key={role.value} value={role.value}>
                        {role.label}
                      </option>
                    ))}
                  </select>
                  {errors.staff_role ? (
                    <FieldError>{errors.staff_role}</FieldError>
                  ) : null}
                </Field>
              </div>

              <Field>
                <FieldLabel htmlFor="staff-role-groups">Nhóm quyền</FieldLabel>
                <div ref={roleTriggerRef}>
                  <DropdownMenu
                    modal={false}
                    open={rolesOpen}
                    onOpenChange={setRolesOpen}
                  >
                    <DropdownMenuTrigger
                      disabled={selectableRoles.length === 0}
                      render={
                        <button
                          type="button"
                          id="staff-role-groups"
                          className={cn(
                            selectClassName,
                            "flex h-auto min-h-8 items-center justify-between gap-2 py-1 text-left",
                          )}
                          aria-invalid={Boolean(errors.role_ids) || undefined}
                        />
                      }
                    >
                      <span className="flex min-w-0 flex-1 flex-wrap items-center gap-1">
                        {form.role_ids.length === 0 ? (
                          <span className="text-muted-foreground">
                            Chọn nhóm quyền
                          </span>
                        ) : (
                          selectableRoles
                            .filter((role) => form.role_ids.includes(role.id))
                            .map((role) => (
                              <Badge key={role.id} variant="secondary">
                                {role.name}
                              </Badge>
                            ))
                        )}
                      </span>
                      <ChevronDownIcon className="size-4 shrink-0 opacity-70" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="start"
                      sideOffset={4}
                      data-staff-role-groups-menu=""
                      className="z-[100] min-w-(--anchor-width) w-(--anchor-width)"
                    >
                      {selectableRoles.map((role) => (
                        <DropdownMenuCheckboxItem
                          key={role.id}
                          checked={form.role_ids.includes(role.id)}
                          onCheckedChange={(checked) =>
                            toggleRole(role.id, checked === true)
                          }
                        >
                          {role.name}
                        </DropdownMenuCheckboxItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                {selectableRoles.length === 0 ? (
                  <FieldDescription>
                    Chưa có nhóm quyền. Khai báo ở menu Nhóm quyền trước.
                  </FieldDescription>
                ) : null}
                {errors.role_ids ? <FieldError>{errors.role_ids}</FieldError> : null}
              </Field>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="staff-phone">Số điện thoại</FieldLabel>
                  <Input
                    id="staff-phone"
                    value={form.phone}
                    onChange={(event) => updateField("phone", event.target.value)}
                    placeholder="0901234567"
                    aria-invalid={Boolean(errors.phone)}
                  />
                  {errors.phone ? <FieldError>{errors.phone}</FieldError> : null}
                </Field>
                <Field>
                  <FieldLabel htmlFor="staff-email">Email</FieldLabel>
                  <Input
                    id="staff-email"
                    type="email"
                    value={form.email}
                    onChange={(event) =>
                      updateField("email", event.target.value.toLowerCase())
                    }
                    placeholder="a@nhaxe.vn"
                    className="lowercase"
                    aria-invalid={Boolean(errors.email)}
                  />
                  {errors.email ? <FieldError>{errors.email}</FieldError> : null}
                </Field>
              </div>

              {!editing ? (
                <>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field>
                      <FieldLabel htmlFor="staff-password">Mật khẩu</FieldLabel>
                      <Input
                        id="staff-password"
                        type="password"
                        value={form.password}
                        onChange={(event) =>
                          updateField("password", event.target.value)
                        }
                        placeholder="Tối thiểu 8 ký tự"
                        autoComplete="new-password"
                        aria-invalid={Boolean(errors.password)}
                      />
                      {errors.password ? (
                        <FieldError>{errors.password}</FieldError>
                      ) : null}
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="staff-confirm-password">
                        Xác nhận mật khẩu
                      </FieldLabel>
                      <Input
                        id="staff-confirm-password"
                        type="password"
                        value={form.confirm_password}
                        onChange={(event) =>
                          updateField("confirm_password", event.target.value)
                        }
                        placeholder="Nhập lại mật khẩu"
                        autoComplete="new-password"
                        aria-invalid={Boolean(errors.confirm_password)}
                      />
                      {errors.confirm_password ? (
                        <FieldError>{errors.confirm_password}</FieldError>
                      ) : null}
                    </Field>
                  </div>

                  <Field orientation="horizontal" className="items-center gap-2">
                    <Checkbox
                      id="staff-status"
                      checked={form.status}
                      onCheckedChange={(checked) =>
                        updateField("status", checked === true)
                      }
                    />
                    <FieldLabel htmlFor="staff-status" className="font-normal">
                      Đang hoạt động
                    </FieldLabel>
                  </Field>
                </>
              ) : null}
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

      <Dialog
        open={Boolean(passwordTarget)}
        onOpenChange={(open) => {
          if (!open) {
            setPasswordTarget(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleResetPassword} className="grid gap-4">
            <DialogHeader>
              <DialogTitle>Đổi mật khẩu</DialogTitle>
              <DialogDescription>
                Đặt mật khẩu mới cho tài khoản{" "}
                {passwordTarget?.full_name || passwordTarget?.username}.
              </DialogDescription>
            </DialogHeader>

            <FieldGroup className="gap-4">
              <Field>
                <FieldLabel htmlFor="reset-password">Mật khẩu mới</FieldLabel>
                <Input
                  id="reset-password"
                  type="password"
                  value={passwordForm.password}
                  onChange={(event) =>
                    setPasswordForm((current) => ({
                      ...current,
                      password: event.target.value,
                    }))
                  }
                  placeholder="Tối thiểu 8 ký tự"
                  autoComplete="new-password"
                  aria-invalid={Boolean(passwordErrors.password)}
                />
                {passwordErrors.password ? (
                  <FieldError>{passwordErrors.password}</FieldError>
                ) : null}
              </Field>
              <Field>
                <FieldLabel htmlFor="reset-confirm-password">
                  Xác nhận mật khẩu
                </FieldLabel>
                <Input
                  id="reset-confirm-password"
                  type="password"
                  value={passwordForm.confirm_password}
                  onChange={(event) =>
                    setPasswordForm((current) => ({
                      ...current,
                      confirm_password: event.target.value,
                    }))
                  }
                  placeholder="Nhập lại mật khẩu mới"
                  autoComplete="new-password"
                  aria-invalid={Boolean(passwordErrors.confirm_password)}
                />
                {passwordErrors.confirm_password ? (
                  <FieldError>{passwordErrors.confirm_password}</FieldError>
                ) : null}
              </Field>
            </FieldGroup>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setPasswordTarget(null)}
              >
                Hủy
              </Button>
              <Button type="submit" disabled={pending}>
                {pending ? "Đang lưu..." : "Đổi mật khẩu"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={Boolean(confirming)}
        onOpenChange={(open) => {
          if (!open) {
            setConfirming(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirming ? confirmCopy(confirming).title : ""}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirming ? confirmCopy(confirming).description : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              variant={
                confirming && confirmCopy(confirming).destructive
                  ? "destructive"
                  : "default"
              }
              onClick={() => void handleConfirmAction()}
              disabled={pending}
            >
              {pending
                ? confirming
                  ? confirmCopy(confirming).pending
                  : "Đang xử lý..."
                : confirming
                  ? confirmCopy(confirming).action
                  : "Xác nhận"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
