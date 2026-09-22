"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, MapPin, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  clearSession,
  getAccount,
  saveWorkspace,
} from "@/lib/auth-session";
import { listOffices, type Office } from "@/lib/offices";
import { toast } from "@/lib/toast";

type OfficeSelectFormProps = {
  onSwitchAccount: () => void;
};

export function OfficeSelectForm({ onSwitchAccount }: OfficeSelectFormProps) {
  const router = useRouter();
  const [offices, setOffices] = useState<Office[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const account = getAccount();
    const companyUuid = account?.company_uuid;

    if (!companyUuid) {
      setLoading(false);
      setError("Tài khoản chưa gắn với nhà xe nên chưa chọn được văn phòng.");
      toast.warning(
        "Tài khoản chưa gắn với nhà xe.",
        "Liên hệ điều hành để được cấp quyền làm việc.",
      );
      return;
    }

    listOffices(companyUuid)
      .then((data) => {
        setOffices(data);
        if (data.length === 1) {
          setSelectedId(data[0].id);
        }
        if (!data.length) {
          toast.info(
            "Nhà xe chưa có văn phòng.",
            "Liên hệ điều hành để khai báo trước khi làm việc.",
          );
        }
      })
      .catch((caught: unknown) => {
        const message =
          caught instanceof Error
            ? caught.message
            : "Không tải được danh sách văn phòng.";
        setError(message);
        toast.error(message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  function handleSwitchAccount() {
    clearSession();
    onSwitchAccount();
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const office = offices.find((item) => item.id === selectedId);
    if (!office) {
      setError("Vui lòng chọn văn phòng làm việc.");
      toast.warning("Vui lòng chọn văn phòng làm việc.");
      return;
    }

    setPending(true);
    saveWorkspace(office);
    toast.success("Đã chọn văn phòng làm việc.", office.name);
    router.replace("/v1");
  }

  const company = offices[0]?.company;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {company ? (
        <div className="flex items-start gap-3 rounded-xl border border-sky-100 bg-sky-50/70 px-3 py-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-white text-sky-700 shadow-sm">
            <Building2 className="size-4" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-slate-800">
              {company.short_name || company.name}
            </p>
            <p className="truncate text-xs text-slate-500">{company.name}</p>
          </div>
        </div>
      ) : null}

      {loading ? (
        <p className="text-sm text-slate-500">Đang tải danh sách văn phòng...</p>
      ) : offices.length ? (
        <fieldset className="space-y-2">
          <legend className="sr-only">Chọn văn phòng làm việc</legend>
          {offices.map((office) => {
            const selected = office.id === selectedId;
            return (
              <label
                key={office.id}
                className={`block cursor-pointer rounded-xl border p-3 transition-colors ${
                  selected
                    ? "border-sky-400 bg-sky-50/80 ring-1 ring-sky-200"
                    : "border-slate-200 bg-white hover:border-sky-200"
                }`}
              >
                <input
                  type="radio"
                  name="office"
                  value={office.id}
                  checked={selected}
                  onChange={() => {
                    setSelectedId(office.id);
                    setError("");
                  }}
                  className="sr-only"
                />
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-800">
                      {office.name}
                    </p>
                    <p className="mt-0.5 text-xs font-medium tracking-wide text-sky-700">
                      {office.office_code}
                    </p>
                  </div>
                  <span
                    className={`mt-0.5 size-4 shrink-0 rounded-full border ${
                      selected
                        ? "border-sky-600 bg-sky-600 shadow-[inset_0_0_0_3px_white]"
                        : "border-slate-300 bg-white"
                    }`}
                  />
                </div>
                {office.address ? (
                  <p className="mt-2 flex items-start gap-1.5 text-xs leading-5 text-slate-500">
                    <MapPin className="mt-0.5 size-3.5 shrink-0" />
                    <span>{office.address}</span>
                  </p>
                ) : null}
                {office.phones.length ? (
                  <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
                    <Phone className="size-3.5 shrink-0" />
                    {office.phones.join(" · ")}
                  </p>
                ) : null}
              </label>
            );
          })}
        </fieldset>
      ) : (
        <p className="text-sm text-slate-500">
          Nhà xe chưa có văn phòng. Liên hệ điều hành để khai báo trước khi làm
          việc.
        </p>
      )}

      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <div className="flex flex-col gap-2">
        <Button
          type="submit"
          size="lg"
          disabled={loading || pending || !offices.length}
          className="h-10 w-full bg-gradient-to-r from-blue-600 to-teal-500 text-white shadow-md shadow-sky-500/20 hover:from-blue-600/90 hover:to-teal-500/90"
        >
          {pending ? "Đang vào hệ thống..." : "Vào làm việc"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          className="h-9 w-full text-slate-500"
          onClick={handleSwitchAccount}
        >
          Đổi tài khoản
        </Button>
      </div>
    </form>
  );
}
