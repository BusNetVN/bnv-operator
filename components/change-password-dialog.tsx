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
import { getAccessToken } from "@/lib/auth-session";
import { changePassword } from "@/lib/identity";
import { toast } from "@/lib/toast";

type FormErrors = {
  current_password?: string;
  new_password?: string;
  confirm_password?: string;
};

type ChangePasswordDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const emptyForm = {
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
  const [pending, setPending] = useState(false);
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
      setPending(false);
    }
    onOpenChange(next);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextErrors: FormErrors = {};
    if (!form.current_password) {
      nextErrors.current_password = "Vui lòng nhập mật khẩu hiện tại.";
    }
    if (!form.new_password) {
      nextErrors.new_password = "Vui lòng nhập mật khẩu mới.";
    } else if (form.new_password.length < 8) {
      nextErrors.new_password = "Mật khẩu mới tối thiểu 8 ký tự.";
    } else if (form.new_password === form.current_password) {
      nextErrors.new_password = "Mật khẩu mới phải khác mật khẩu hiện tại.";
    }
    if (!form.confirm_password) {
      nextErrors.confirm_password = "Vui lòng xác nhận mật khẩu mới.";
    } else if (form.confirm_password !== form.new_password) {
      nextErrors.confirm_password = "Xác nhận mật khẩu không khớp.";
    }

    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      return;
    }

    const token = getAccessToken();
    if (!token) {
      toast.error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
      return;
    }

    setPending(true);
    setErrors({});

    try {
      await changePassword(token, {
        current_password: form.current_password,
        new_password: form.new_password,
      });
      toast.success("Đổi mật khẩu thành công.");
      handleOpenChange(false);
    } catch (error) {
      toast.fromError(error, "Không đổi được mật khẩu. Vui lòng thử lại.");
    } finally {
      setPending(false);
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
