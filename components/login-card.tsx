"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BrandLogo } from "@/components/brand-logo";
import { LoginForm } from "@/components/login-form";
import { OfficeSelectForm } from "@/components/office-select-form";
import {
  getAccessToken,
  getAccount,
  getWorkspace,
} from "@/lib/auth-session";

export function LoginCard() {
  const router = useRouter();
  const [step, setStep] = useState<"login" | "office">("login");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (getAccessToken() && getAccount()) {
      if (getWorkspace()) {
        router.replace("/v1");
        return;
      }
      setStep("office");
    }
    setReady(true);
  }, [router]);

  if (!ready) {
    return null;
  }

  const isOfficeStep = step === "office";

  return (
    <>
      <div className="mb-6 space-y-1.5">
        <div className="mb-5 flex justify-center">
          <BrandLogo priority />
        </div>
        <h2 className="font-heading text-xl font-semibold tracking-tight text-slate-800">
          {isOfficeStep ? "Chọn văn phòng làm việc" : "Đăng nhập"}
        </h2>
        <p className="text-sm text-slate-500">
          {isOfficeStep
            ? "Chọn văn phòng để tiếp tục vào hệ thống vận hành."
            : "Sử dụng tài khoản nhân viên nhà xe để tiếp tục."}
        </p>
      </div>
      {isOfficeStep ? (
        <OfficeSelectForm onSwitchAccount={() => setStep("login")} />
      ) : (
        <LoginForm onSuccess={() => setStep("office")} />
      )}
    </>
  );
}
