"use client";

import { useEffect, useMemo, useState } from "react";
import {
  KeyRoundIcon,
  LockIcon,
  MoreHorizontalIcon,
  PencilIcon,
  PlusIcon,
  SearchIcon,
  Trash2Icon,
  UnlockIcon,
} from "lucide-react";

import { AuditInfo } from "@/components/shared/audit-info";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAuthStore } from "@/features/auth/stores/auth.store";
import { useRoles } from "@/features/permission/hooks/use-roles";
import { UserFormDialog } from "@/features/user/components/user-form-dialog";
import { UserPasswordDialog } from "@/features/user/components/user-password-dialog";
import { useUsers } from "@/features/user/hooks/use-users";
import {
  deleteUser,
  setUserStatus,
} from "@/features/user/services/user.service";
import type { User } from "@/features/user/types/user.types";
import {
  staffRoleLabel,
  statusLabel,
  userRoleNames,
} from "@/features/user/utils/user-input";
import { toast } from "@/lib/toast";

type ConfirmAction =
  | { kind: "delete"; user: User }
  | { kind: "lock"; user: User }
  | { kind: "unlock"; user: User };

function displayName(user: User) {
  return user.full_name || user.username;
}

function confirmCopy(action: ConfirmAction) {
  const name = displayName(action.user);
  if (action.kind === "delete") {
    return {
      title: "Xóa nhân sự?",
      description: `Tài khoản ${name} sẽ bị xóa khỏi hệ thống.`,
      action: "Xóa",
      pending: "Đang xóa...",
      done: "Đã xóa nhân sự.",
      failed: "Không xóa được nhân sự. Vui lòng thử lại.",
      destructive: true,
    };
  }
  if (action.kind === "lock") {
    return {
      title: "Khóa tài khoản?",
      description: `Tài khoản ${name} sẽ không đăng nhập được cho đến khi được mở khóa.`,
      action: "Khóa",
      pending: "Đang khóa...",
      done: "Đã khóa tài khoản.",
      failed: "Không khóa được tài khoản. Vui lòng thử lại.",
      destructive: true,
    };
  }
  return {
    title: "Mở khóa tài khoản?",
    description: `Tài khoản ${name} sẽ đăng nhập được trở lại.`,
    action: "Mở khóa",
    pending: "Đang mở khóa...",
    done: "Đã mở khóa tài khoản.",
    failed: "Không mở khóa được tài khoản. Vui lòng thử lại.",
    destructive: false,
  };
}

export function UsersPage() {
  // Rendered inside DashboardShell, which only shows pages once the session is loaded.
  const companyUuid = useAuthStore((state) => state.account?.company_uuid ?? null);
  const currentAccountId = useAuthStore((state) => state.account?.id ?? null);
  const companyCode = useAuthStore(
    (state) => state.workspace?.company.company_code ?? "",
  );
  const { users, loading, error: loadError, reload } = useUsers(companyUuid);
  const { roles, error: rolesError } = useRoles(companyUuid);
  const [query, setQuery] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [passwordTarget, setPasswordTarget] = useState<User | null>(null);
  const [confirming, setConfirming] = useState<ConfirmAction | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!companyUuid) {
      toast.warning(
        "Tài khoản chưa gắn với nhà xe.",
        "Chưa khai báo được nhân sự.",
      );
    }
  }, [companyUuid]);

  useEffect(() => {
    if (loadError) {
      toast.fromError(loadError, "Không tải được danh sách nhân sự.");
    }
  }, [loadError]);

  useEffect(() => {
    if (rolesError) {
      toast.fromError(rolesError, "Không tải được danh sách nhóm quyền.");
    }
  }, [rolesError]);

  const filteredUsers = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    if (!keyword) {
      return users;
    }

    return users.filter((user) =>
      [
        user.username,
        user.full_name,
        user.email,
        user.phone,
        staffRoleLabel(user.staff_role),
        userRoleNames(user),
        statusLabel(user.status),
      ]
        .join(" ")
        .toLowerCase()
        .includes(keyword),
    );
  }, [users, query]);

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(user: User) {
    setEditing(user);
    setFormOpen(true);
  }

  async function handleConfirmAction() {
    if (!confirming || !companyUuid) {
      return;
    }

    const copy = confirmCopy(confirming);
    setPending(true);
    try {
      if (confirming.kind === "delete") {
        await deleteUser(confirming.user.id);
      } else {
        await setUserStatus(confirming.user.id, confirming.kind === "unlock");
      }
      toast.success(copy.done, displayName(confirming.user));
      await reload();
    } catch (error: unknown) {
      toast.fromError(error, copy.failed);
    } finally {
      setConfirming(null);
      setPending(false);
    }
  }

  const confirmText = confirming ? confirmCopy(confirming) : null;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-800">
            Nhân sự
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Khai báo điều hành, nhân viên, tài xế và phụ xe của nhà xe.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative min-w-0 max-w-sm flex-1">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Tìm tên, tài khoản, vai trò, nhóm quyền..."
            className="pl-8"
          />
        </div>
        <Button onClick={openCreate} disabled={!companyUuid}>
          <PlusIcon />
          Thêm nhân sự
        </Button>
      </div>

      <div className="overflow-hidden rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Họ tên</TableHead>
              <TableHead>Tên đăng nhập</TableHead>
              <TableHead>Vai trò</TableHead>
              <TableHead>Nhóm quyền</TableHead>
              <TableHead>Liên hệ</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead className="hidden lg:table-cell">Tạo</TableHead>
              <TableHead className="hidden lg:table-cell">Cập nhật</TableHead>
              <TableHead className="w-12 text-right">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={9} className="h-24 text-center text-muted-foreground">
                  Đang tải danh sách nhân sự...
                </TableCell>
              </TableRow>
            ) : filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="h-24 text-center text-muted-foreground">
                  {users.length === 0
                    ? "Chưa có nhân sự nào. Bấm Thêm nhân sự để khai báo."
                    : "Không tìm thấy nhân sự phù hợp."}
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((user) => {
                const isCurrent = user.id === currentAccountId;
                const name = displayName(user);

                return (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.full_name || "—"}</TableCell>
                    <TableCell className="lowercase">{user.username}</TableCell>
                    <TableCell>{staffRoleLabel(user.staff_role)}</TableCell>
                    <TableCell className="max-w-64">
                      {user.roles?.length ? (
                        <div className="flex flex-wrap gap-1">
                          {user.roles.map((role) => (
                            <Badge key={role.id} variant="secondary" title={role.name}>
                              {role.name}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="max-w-56">
                      <div className="flex flex-col">
                        <span>{user.phone || "—"}</span>
                        <span
                          className="truncate text-xs text-muted-foreground"
                          title={user.email}
                        >
                          {user.email || "—"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.status ? "default" : "outline"}>
                        {statusLabel(user.status)}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <AuditInfo username={user.created_by} timestamp={user.created_at} />
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <AuditInfo username={user.updated_by} timestamp={user.updated_at} />
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          render={<Button variant="ghost" size="icon-sm" />}
                        >
                          <MoreHorizontalIcon />
                          <span className="sr-only">Thao tác {name}</span>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-auto min-w-44">
                          <DropdownMenuItem onClick={() => openEdit(user)}>
                            <PencilIcon />
                            Sửa
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setPasswordTarget(user)}>
                            <KeyRoundIcon />
                            Đổi mật khẩu
                          </DropdownMenuItem>
                          {user.status ? (
                            <DropdownMenuItem
                              disabled={isCurrent}
                              onClick={() => setConfirming({ kind: "lock", user })}
                            >
                              <LockIcon />
                              Khóa tài khoản
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem
                              onClick={() => setConfirming({ kind: "unlock", user })}
                            >
                              <UnlockIcon />
                              Mở khóa tài khoản
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            variant="destructive"
                            disabled={isCurrent}
                            onClick={() => setConfirming({ kind: "delete", user })}
                          >
                            <Trash2Icon />
                            Xóa
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <UserFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        editing={editing}
        companyCode={companyCode}
        roles={roles}
        onSaved={reload}
      />

      <UserPasswordDialog
        user={passwordTarget}
        onClose={() => setPasswordTarget(null)}
      />

      <AlertDialog
        open={Boolean(confirming)}
        onOpenChange={(open) => {
          if (!open) {
            setConfirming(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmText?.title}</AlertDialogTitle>
            <AlertDialogDescription>{confirmText?.description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              variant={confirmText?.destructive ? "destructive" : "default"}
              onClick={() => void handleConfirmAction()}
              disabled={pending}
            >
              {pending ? (confirmText?.pending ?? "Đang xử lý...") : (confirmText?.action ?? "Xác nhận")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
