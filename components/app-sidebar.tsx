"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ChevronRight, LogOut } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { clearSession } from "@/lib/auth-session";
import {
  dashboardNav,
  isNavActive,
  type NavItem,
} from "@/lib/dashboard-nav";
import type { PublicAccount } from "@/lib/identity";
import type { Office } from "@/lib/offices";

type AppSidebarProps = {
  account: PublicAccount;
  workspace: Office;
};

function NestedNavItem({ item }: { item: NavItem }) {
  const pathname = usePathname();
  const { state } = useSidebar();
  const children = item.items ?? [];
  const isSectionActive = children.some((child) =>
    isNavActive(pathname, child.href),
  );

  if (state === "collapsed") {
    return (
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={<SidebarMenuButton isActive={isSectionActive} />}
          >
            <item.icon />
            <span>{item.title}</span>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            side="right"
            align="start"
            sideOffset={8}
            className="min-w-48 w-auto"
          >
            {children.map((child) => (
              <DropdownMenuItem
                key={child.href}
                nativeButton={false}
                render={<Link href={child.href} />}
              >
                {child.title}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    );
  }

  return (
    <Collapsible
      defaultOpen={isSectionActive}
      render={<SidebarMenuItem className="group/collapsible" />}
    >
      <CollapsibleTrigger
        render={
          <SidebarMenuButton tooltip={item.title} isActive={isSectionActive} />
        }
      >
        <item.icon />
        <span>{item.title}</span>
        <ChevronRight className="ml-auto transition-transform duration-200 group-data-open/collapsible:rotate-90" />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <SidebarMenuSub>
          {children.map((child) => (
            <SidebarMenuSubItem key={child.href}>
              <SidebarMenuSubButton
                render={<Link href={child.href} />}
                isActive={isNavActive(pathname, child.href)}
              >
                <span>{child.title}</span>
              </SidebarMenuSubButton>
            </SidebarMenuSubItem>
          ))}
        </SidebarMenuSub>
      </CollapsibleContent>
    </Collapsible>
  );
}

export function AppSidebar({ account, workspace }: AppSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const companyName =
    workspace.company.short_name || workspace.company.name;
  const officeName = workspace.name;

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              render={<Link href="/v1" />}
              tooltip={`${companyName} · ${officeName}`}
            >
              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-[10px] font-semibold tracking-wide text-primary-foreground">
                {workspace.company.company_code.slice(0, 3).toUpperCase()}
              </span>
              <span className="grid min-w-0 flex-1 text-left leading-tight group-data-[collapsible=icon]:hidden">
                <span className="truncate font-medium">{companyName}</span>
                <span className="truncate text-xs text-muted-foreground">
                  {officeName}
                </span>
              </span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {dashboardNav.map((item) => {
                if (item.items?.length) {
                  return <NestedNavItem key={item.title} item={item} />;
                }

                const href = item.href ?? "/v1";
                const isActive = isNavActive(pathname, href);

                return (
                  <SidebarMenuItem key={href}>
                    <SidebarMenuButton
                      render={<Link href={href} />}
                      isActive={isActive}
                      tooltip={item.title}
                    >
                      <item.icon />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        <div className="rounded-lg bg-sidebar-accent/70 px-3 py-2 group-data-[collapsible=icon]:hidden">
          <p className="truncate text-sm font-medium">
            {account.full_name || account.username}
          </p>
          <p className="truncate text-xs text-muted-foreground">
            {account.account_type === "SYSTEM_ADMIN"
              ? "Quản trị hệ thống"
              : "Nhân viên nhà xe"}
          </p>
        </div>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Đăng xuất"
              onClick={() => {
                clearSession();
                router.replace("/login");
              }}
            >
              <LogOut />
              <span>Đăng xuất</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
