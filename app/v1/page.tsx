"use client";

import { useEffect, useState } from "react";
import { Globe, Package, Ticket, Wallet } from "lucide-react";
import { getAccount, getWorkspace } from "@/lib/auth-session";
import type { PublicAccount } from "@/lib/identity";
import type { Office } from "@/lib/offices";

const cards = [
  {
    title: "Vé bán hôm nay",
    value: "—",
    hint: "Vé đã xuất tại quầy",
    icon: Ticket,
  },
  {
    title: "Hàng hóa",
    value: "—",
    hint: "Đơn hàng đang vận chuyển",
    icon: Package,
  },
  {
    title: "Vé online",
    value: "—",
    hint: "Vé đặt trên kênh online",
    icon: Globe,
  },
  {
    title: "Doanh thu",
    value: "—",
    hint: "Tổng thu trong ngày",
    icon: Wallet,
  },
];

export default function DashboardPage() {
  const [account, setAccount] = useState<PublicAccount | null>(null);
  const [workspace, setWorkspace] = useState<Office | null>(null);

  useEffect(() => {
    setAccount(getAccount());
    setWorkspace(getWorkspace());
  }, []);

  const companyName =
    workspace?.company.short_name || workspace?.company.name || "";

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-800">
          Xin chào, {account?.full_name || account?.username || "nhân viên"}
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          {workspace
            ? `Bạn đang làm việc tại ${workspace.name}${companyName ? ` · ${companyName}` : ""}.`
            : "Đây là bảng điều khiển vận hành nhà xe. Chọn mục bên trái để làm việc."}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <div
            key={card.title}
            className="rounded-xl border bg-card p-4 shadow-sm"
          >
            <div className="mb-3 flex size-9 items-center justify-center rounded-lg bg-sky-50 text-sky-700">
              <card.icon className="size-4" />
            </div>
            <p className="text-sm text-muted-foreground">{card.title}</p>
            <p className="mt-1 text-2xl font-semibold tracking-tight">
              {card.value}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">{card.hint}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
