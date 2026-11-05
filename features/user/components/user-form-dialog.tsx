"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDownIcon } from "lucide-react";

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
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import type { Role } from "@/features/permission/types/role.types";
import {
  userSchema,
  type UserFormValues,
} from "@/features/user/schemas/user.schema";
import { createUser, updateUser } from "@/features/user/services/user.service";
import type { StaffRole, User } from "@/features/user/types/user.types";
import {
  companyUsernameSuffix,
  emptyUserInput,
  STAFF_ROLES,
  toUserInput,
  usernameLocalPart,
} from "@/features/user/utils/user-input";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { firstFieldErrors } from "@/lib/validation";

const selectClassName = cn(
  "h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none",
  "transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
  "disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50",
  "aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20",
);

type FormErrors = Partial<Record<keyof UserFormValues, string>>;

type UserFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** null to create a new account. */
  editing: User | null;
  /** Code of the working company, appended to usernames. */
  companyCode: string;
  /** Roles (nhóm quyền) of the company that can be granted. */
  roles: Role[];
  /** Called after a successful save, before the dialog closes. */
  onSaved: () => Promise<void>;
};

export function UserFormDialog({
  open,
  onOpenChange,
  editing,
  companyCode,
  roles,
  onSaved,
}: UserFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        {/* The popup unmounts when closed, so every opening starts from a fresh form. */}
        <UserForm
          key={editing?.id ?? "new"}
          editing={editing}
          companyCode={companyCode}
          roles={roles}
          onSaved={onSaved}
          onClose={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}

function UserForm({
  editing,
  companyCode,
  roles,
  onSaved,
  onClose,
}: Omit<UserFormDialogProps, "open" | "onOpenChange"> & {
  onClose: () => void;
}) {
  const [form, setForm] = useState<UserFormValues>(() =>
    editing ? toUserInput(editing, companyCode) : emptyUserInput(),
  );
  const [errors, setErrors] = useState<FormErrors>({});
  const [pending, setPending] = useState(false);
  const [rolesOpen, setRolesOpen] = useState(false);
  const roleTriggerRef = useRef<HTMLDivElement>(null);
  const usernameSuffix = companyUsernameSuffix(companyCode);

  const selectableRoles = useMemo(() => {
    const assigned = new Set(form.role_ids);
    return roles.filter((role) => role.is_active || assigned.has(role.id));
  }, [form.role_ids, roles]);

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
        target instanceof Element && target.closest("[data-user-roles-menu]");
      if (!onTrigger && !onMenu) {
        setRolesOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown, true);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown, true);
    };
  }, [rolesOpen]);

  function updateField<K extends keyof UserFormValues>(
    key: K,
    value: UserFormValues[K],
  ) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function toggleRole(id: string, checked: boolean) {
    const selected = new Set(form.role_ids);
    if (checked) {
      selected.add(id);
    } else {
      selected.delete(id);
    }
    updateField("role_ids", [...selected]);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const parsed = userSchema({ companyCode, isCreate: !editing }).safeParse(form);
    if (!parsed.success) {
      setErrors(firstFieldErrors(parsed.error));
      return;
    }
    const payload = parsed.data;

    setPending(true);
    setErrors({});
    try {
      if (editing) {
        await updateUser(editing.id, payload);
        toast.success("Đã cập nhật nhân sự.", payload.full_name || payload.username);
      } else {
        await createUser(payload);
        toast.success("Đã thêm nhân sự.", payload.full_name || payload.username);
      }
      await onSaved();
      onClose();
    } catch (error: unknown) {
      toast.fromError(error, "Không lưu được nhân sự. Vui lòng thử lại.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      <DialogHeader>
        <DialogTitle>{editing ? "Sửa nhân sự" : "Thêm nhân sự"}</DialogTitle>
        <DialogDescription>
          Tài khoản thuộc nhà xe hiện tại. Tên đăng nhập không được trùng.
        </DialogDescription>
      </DialogHeader>

      <FieldGroup className="gap-4">
        <Field>
          <FieldLabel htmlFor="user-full-name">Họ tên</FieldLabel>
          <Input
            id="user-full-name"
            value={form.full_name}
            onChange={(event) => updateField("full_name", event.target.value)}
            placeholder="Nguyễn Văn A"
            aria-invalid={Boolean(errors.full_name)}
          />
          {errors.full_name ? <FieldError>{errors.full_name}</FieldError> : null}
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="user-username">Tên đăng nhập</FieldLabel>
            <div
              className={cn(
                "flex min-w-0 overflow-hidden rounded-lg border border-input bg-transparent",
                "focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50",
                errors.username && "border-destructive ring-3 ring-destructive/20",
              )}
            >
              <Input
                id="user-username"
                value={form.username}
                onChange={(event) =>
                  updateField(
                    "username",
                    usernameLocalPart(event.target.value.toLowerCase(), companyCode),
                  )
                }
                placeholder="nguyenvana"
                className="rounded-none border-0 lowercase shadow-none focus-visible:ring-0"
                autoComplete="off"
                aria-invalid={Boolean(errors.username)}
              />
              {usernameSuffix ? (
                <span className="inline-flex shrink-0 items-center border-l border-input bg-muted/40 px-2.5 text-sm text-muted-foreground lowercase">
                  {usernameSuffix}
                </span>
              ) : null}
            </div>
            {errors.username ? <FieldError>{errors.username}</FieldError> : null}
          </Field>
          <Field>
            <FieldLabel htmlFor="user-staff-role">Vai trò</FieldLabel>
            <select
              id="user-staff-role"
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
            {errors.staff_role ? <FieldError>{errors.staff_role}</FieldError> : null}
          </Field>
        </div>

        <Field>
          <FieldLabel htmlFor="user-roles">Nhóm quyền</FieldLabel>
          <div ref={roleTriggerRef}>
            <DropdownMenu modal={false} open={rolesOpen} onOpenChange={setRolesOpen}>
              <DropdownMenuTrigger
                disabled={selectableRoles.length === 0}
                render={
                  <button
                    type="button"
                    id="user-roles"
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
                    <span className="text-muted-foreground">Chọn nhóm quyền</span>
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
                data-user-roles-menu=""
                className="z-[100] min-w-(--anchor-width) w-(--anchor-width)"
              >
                {selectableRoles.map((role) => (
                  <DropdownMenuCheckboxItem
                    key={role.id}
                    checked={form.role_ids.includes(role.id)}
                    onCheckedChange={(checked) => toggleRole(role.id, checked === true)}
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
            <FieldLabel htmlFor="user-phone">Số điện thoại</FieldLabel>
            <Input
              id="user-phone"
              value={form.phone}
              onChange={(event) => updateField("phone", event.target.value)}
              placeholder="0901234567"
              aria-invalid={Boolean(errors.phone)}
            />
            {errors.phone ? <FieldError>{errors.phone}</FieldError> : null}
          </Field>
          <Field>
            <FieldLabel htmlFor="user-email">Email</FieldLabel>
            <Input
              id="user-email"
              type="email"
              value={form.email}
              onChange={(event) => updateField("email", event.target.value.toLowerCase())}
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
                <FieldLabel htmlFor="user-password">Mật khẩu</FieldLabel>
                <Input
                  id="user-password"
                  type="password"
                  value={form.password}
                  onChange={(event) => updateField("password", event.target.value)}
                  placeholder="Tối thiểu 8 ký tự"
                  autoComplete="new-password"
                  aria-invalid={Boolean(errors.password)}
                />
                {errors.password ? <FieldError>{errors.password}</FieldError> : null}
              </Field>
              <Field>
                <FieldLabel htmlFor="user-confirm-password">
                  Xác nhận mật khẩu
                </FieldLabel>
                <Input
                  id="user-confirm-password"
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
                id="user-status"
                checked={form.status}
                onCheckedChange={(checked) => updateField("status", checked === true)}
              />
              <FieldLabel htmlFor="user-status" className="font-normal">
                Đang hoạt động
              </FieldLabel>
            </Field>
          </>
        ) : null}
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
