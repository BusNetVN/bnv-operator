"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppSidebar } from "@/components/app-sidebar";
import { DashboardHeader } from "@/components/dashboard-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { getAccount, getAccessToken, getWorkspace } from "@/lib/auth-session";
import type { PublicAccount } from "@/lib/identity";
import type { Office } from "@/lib/offices";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [account, setAccount] = useState<PublicAccount | null>(null);
  const [workspace, setWorkspace] = useState<Office | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const sessionAccount = getAccount();
    const selectedOffice = getWorkspace();
    if (!getAccessToken() || !sessionAccount) {
      router.replace("/login");
      return;
    }

    if (!selectedOffice) {
      router.replace("/login");
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
          <div className="flex-1 bg-muted/30 p-6">{children}</div>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}
