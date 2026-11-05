"use client";

import { useState } from "react";

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
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  resetPasswordSchema,
  type ResetPasswordFormValues,
} from "@/features/user/schemas/user.schema";
import { resetUserPassword } from "@/features/user/services/user.service";
import type { User } from "@/features/user/types/user.types";
import { toast } from "@/lib/toast";
import { firstFieldErrors } from "@/lib/validation";

type FormErrors = Partial<Record<keyof ResetPasswordFormValues, string>>;

type UserPasswordDialogProps = {
  /** Account whose password is reset; null keeps the dialog closed. */
  user: User | null;
  onClose: () => void;
};

/** A manager sets a new password for another staff account. */
export function UserPasswordDialog({ user, onClose }: UserPasswordDialogProps) {
  return (
    <Dialog
      open={Boolean(user)}
      onOpenChange={(open) => {
        if (!open) {
          onClose();
        }
      }}
    >
      <DialogContent className="sm:max-w-md">
        {user ? <PasswordForm key={user.id} user={user} onClose={onClose} /> : null}
      </DialogContent>
    </Dialog>
  );
}

function PasswordForm({ user, onClose }: { user: User; onClose: () => void }) {
  const [form, setForm] = useState<ResetPasswordFormValues>({
    password: "",
    confirm_password: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [pending, setPending] = useState(false);
  const name = user.full_name || user.username;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const parsed = resetPasswordSchema.safeParse(form);
    if (!parsed.success) {
      setErrors(firstFieldErrors(parsed.error));
      return;
    }

    setPending(true);
    setErrors({});
    try {
      await resetUserPassword(user.id, parsed.data.password);
      toast.success("Đã đổi mật khẩu.", name);
      onClose();
    } catch (error: unknown) {
      toast.fromError(error, "Không đổi được mật khẩu. Vui lòng thử lại.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      <DialogHeader>
        <DialogTitle>Đổi mật khẩu</DialogTitle>
        <DialogDescription>Đặt mật khẩu mới cho tài khoản {name}.</DialogDescription>
      </DialogHeader>

      <FieldGroup className="gap-4">
        <Field>
          <FieldLabel htmlFor="reset-password">Mật khẩu mới</FieldLabel>
          <Input
            id="reset-password"
            type="password"
            value={form.password}
            onChange={(event) =>
              setForm((current) => ({ ...current, password: event.target.value }))
            }
            placeholder="Tối thiểu 8 ký tự"
            autoComplete="new-password"
            aria-invalid={Boolean(errors.password)}
          />
          {errors.password ? <FieldError>{errors.password}</FieldError> : null}
        </Field>
        <Field>
          <FieldLabel htmlFor="reset-confirm-password">Xác nhận mật khẩu</FieldLabel>
          <Input
            id="reset-confirm-password"
            type="password"
            value={form.confirm_password}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                confirm_password: event.target.value,
              }))
            }
            placeholder="Nhập lại mật khẩu mới"
            autoComplete="new-password"
            aria-invalid={Boolean(errors.confirm_password)}
          />
          {errors.confirm_password ? (
            <FieldError>{errors.confirm_password}</FieldError>
          ) : null}
        </Field>
      </FieldGroup>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose}>
          Hủy
        </Button>
        <Button type="submit" disabled={pending}>
          {pending ? "Đang lưu..." : "Đổi mật khẩu"}
        </Button>
      </DialogFooter>
    </form>
  );
}
