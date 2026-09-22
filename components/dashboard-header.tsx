"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  ChevronDown,
  CircleUser,
  Package,
  Ticket,
} from "lucide-react";
import { ChangePasswordDialog } from "@/components/change-password-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { clearWorkspace } from "@/lib/auth-session";
import { toast } from "@/lib/toast";
import type { PublicAccount } from "@/lib/identity";
import type { Office } from "@/lib/offices";

type LookupMode = "ticket" | "cargo";

const MODES: Array<{
  id: LookupMode;
  label: string;
  icon: typeof Ticket;
}> = [
  { id: "ticket", label: "Vé", icon: Ticket },
  { id: "cargo", label: "Hàng", icon: Package },
];

type DashboardHeaderProps = {
  account: PublicAccount;
  workspace: Office;
};

export function DashboardHeader({ account, workspace }: DashboardHeaderProps) {
  const router = useRouter();
  const [mode, setMode] = useState<LookupMode>("ticket");
  const [phone, setPhone] = useState("");
  const [passwordOpen, setPasswordOpen] = useState(false);
  const companyName =
    workspace.company.short_name || workspace.company.name;

  function handlePhoneChange(event: React.ChangeEvent<HTMLInputElement>) {
    setPhone(event.target.value.replace(/[^\d+\s]/g, ""));
  }

  function handleLookup(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
  }

  function handleSwitchOffice() {
    clearWorkspace();
    toast.info("Chọn lại văn phòng làm việc.");
    router.replace("/login");
  }

  return (
    <header className="flex h-14 items-center gap-3 border-b bg-background/80 px-4 backdrop-blur-sm">
      <SidebarTrigger />

      <form
        onSubmit={handleLookup}
        className="flex min-w-0 flex-1 items-center"
      >
        <div className="flex h-9 w-full max-w-xl overflow-hidden rounded-lg border border-input bg-background shadow-xs">
          <div className="flex shrink-0 border-r border-input bg-muted/40 p-0.5">
            {MODES.map((item) => {
              const selected = mode === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setMode(item.id)}
                  className={`inline-flex items-center gap-1.5 rounded-md px-2.5 text-xs font-medium transition-colors ${
                    selected
                      ? "bg-background text-sky-700 shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  aria-pressed={selected}
                >
                  <item.icon className="size-3.5" />
                  {item.label}
                </button>
              );
            })}
          </div>
          <Input
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            value={phone}
            onChange={handlePhoneChange}
            placeholder={
              mode === "ticket"
                ? "Nhập số điện thoại tìm vé"
                : "Nhập số điện thoại tìm hàng"
            }
            aria-label="Số điện thoại"
            className="h-full rounded-none border-0 bg-transparent shadow-none focus-visible:ring-0"
          />
        </div>
      </form>

      <div className="ml-auto flex items-center gap-0.5">
        <DropdownMenu>
          <DropdownMenuTrigger
            render={<Button variant="ghost" className="h-8 w-auto gap-1 px-2" />}
            aria-label="Tài khoản"
          >
            <CircleUser />
            <ChevronDown className="size-3.5 opacity-70" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-56">
            <DropdownMenuGroup>
              <DropdownMenuLabel>
                {account.full_name || account.username}
              </DropdownMenuLabel>
              <p className="px-1.5 pb-1 text-xs text-muted-foreground">
                {workspace.name} · {companyName}
              </p>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSwitchOffice}>
              Đổi văn phòng
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setPasswordOpen(true)}>
              Đổi mật khẩu
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <NotificationMenu
          label="Thông báo"
          icon={Bell}
          emptyText="Chưa có thông báo mới."
        />
        <NotificationMenu
          label="Thông báo vé"
          icon={Ticket}
          emptyText="Chưa có thông báo vé."
        />
      </div>
      <ChangePasswordDialog
        open={passwordOpen}
        onOpenChange={setPasswordOpen}
      />
    </header>
  );
}

function NotificationMenu({
  label,
  icon: Icon,
  emptyText,
}: {
  label: string;
  icon: typeof Bell;
  emptyText: string;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button variant="ghost" size="icon" />}
        aria-label={label}
      >
        <Icon />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-64">
        <DropdownMenuGroup>
          <DropdownMenuLabel>{label}</DropdownMenuLabel>
        </DropdownMenuGroup>
        <p className="px-1.5 py-3 text-center text-sm text-muted-foreground">
          {emptyText}
        </p>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
