"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
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
import { useChangePassword } from "@/features/auth/hooks/use-change-password";
import {
  changePasswordSchema,
  type ChangePasswordForm,
} from "@/features/auth/schemas/change-password.schema";
import { useAuthStore } from "@/features/auth/stores/auth.store";
import { toast } from "@/lib/toast";
import { firstFieldErrors } from "@/lib/validation";

type FormErrors = Partial<Record<keyof ChangePasswordForm, string>>;

type ChangePasswordDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const emptyForm: ChangePasswordForm = {
  current_password: "",
  new_password: "",
  confirm_password: "",
};

export function ChangePasswordDialog({
  open,
  onOpenChange,
}: ChangePasswordDialogProps) {
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState<FormErrors>({});
  const { changePassword, pending } = useChangePassword();
  const [visible, setVisible] = useState({
    current: false,
    next: false,
    confirm: false,
  });

  function updateField(key: keyof typeof emptyForm, value: string) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function handleOpenChange(next: boolean) {
    if (!next) {
      setForm(emptyForm);
      setErrors({});
    }
    onOpenChange(next);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const parsed = changePasswordSchema.safeParse(form);
    if (!parsed.success) {
      setErrors(firstFieldErrors(parsed.error));
      return;
    }

    if (!useAuthStore.getState().refreshToken) {
      toast.error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
      return;
    }

    setErrors({});
    try {
      await changePassword({
        current_password: parsed.data.current_password,
        new_password: parsed.data.new_password,
      });
      toast.success("Đổi mật khẩu thành công.");
      handleOpenChange(false);
    } catch (error) {
      toast.fromError(error, "Không đổi được mật khẩu. Vui lòng thử lại.");
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit} className="grid gap-4">
          <DialogHeader>
            <DialogTitle>Đổi mật khẩu</DialogTitle>
            <DialogDescription>
              Nhập mật khẩu hiện tại và mật khẩu mới để tiếp tục.
            </DialogDescription>
          </DialogHeader>

          <FieldGroup className="gap-4">
            <PasswordField
              id="current_password"
              label="Mật khẩu hiện tại"
              value={form.current_password}
              visible={visible.current}
              error={errors.current_password}
              autoComplete="current-password"
              onToggle={() =>
                setVisible((state) => ({ ...state, current: !state.current }))
              }
              onChange={(value) => updateField("current_password", value)}
            />
            <PasswordField
              id="new_password"
              label="Mật khẩu mới"
              value={form.new_password}
              visible={visible.next}
              error={errors.new_password}
              autoComplete="new-password"
              onToggle={() =>
                setVisible((state) => ({ ...state, next: !state.next }))
              }
              onChange={(value) => updateField("new_password", value)}
            />
            <PasswordField
              id="confirm_password"
              label="Xác nhận mật khẩu mới"
              value={form.confirm_password}
              visible={visible.confirm}
              error={errors.confirm_password}
              autoComplete="new-password"
              onToggle={() =>
                setVisible((state) => ({ ...state, confirm: !state.confirm }))
              }
              onChange={(value) => updateField("confirm_password", value)}
            />
          </FieldGroup>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
            >
              Hủy
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Đang lưu..." : "Lưu mật khẩu"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function PasswordField({
  id,
  label,
  value,
  visible,
  error,
  autoComplete,
  onToggle,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  visible: boolean;
  error?: string;
  autoComplete: string;
  onToggle: () => void;
  onChange: (value: string) => void;
}) {
  return (
    <Field data-invalid={Boolean(error) || undefined}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <div className="relative">
        <Input
          id={id}
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          aria-invalid={Boolean(error) || undefined}
          className="h-10 pr-10"
        />
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="absolute top-1/2 right-1.5 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          onClick={onToggle}
          aria-label={visible ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
        >
          {visible ? <EyeOff /> : <Eye />}
        </Button>
      </div>
      <FieldError>{error}</FieldError>
    </Field>
  );
}
