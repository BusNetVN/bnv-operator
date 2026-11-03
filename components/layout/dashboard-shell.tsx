"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuthStore } from "@/features/auth/stores/auth.store";
import type { PublicAccount } from "@/features/auth/types/auth.types";
import type { Office } from "@/features/office/types/office.types";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [account, setAccount] = useState<PublicAccount | null>(null);
  const [workspace, setWorkspace] = useState<Office | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const {
      accessToken,
      account: sessionAccount,
      workspace: selectedOffice,
    } = useAuthStore.getState();
    if (!accessToken || !sessionAccount) {
      router.replace("/dang-nhap");
      return;
    }

    if (!selectedOffice) {
      router.replace("/dang-nhap");
      return;
    }

    setAccount(sessionAccount);
    setWorkspace(selectedOffice);
    setReady(true);
  }, [router]);

  if (!ready || !account || !workspace) {
    return null;
  }

  return (
    <TooltipProvider>
      <SidebarProvider>
        <AppSidebar account={account} workspace={workspace} />
        <SidebarInset>
          <DashboardHeader account={account} workspace={workspace} />
          <div className="flex-1 bg-muted/30 p-2">{children}</div>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}
