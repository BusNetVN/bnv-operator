import type {
  Role,
  RoleInput,
  RolePermission,
} from "@/features/permission/types/role.types";

export function statusLabel(status: boolean) {
  return status ? "Đang hoạt động" : "Ngưng hoạt động";
}

export function emptyRoleInput(): RoleInput {
  return {
    name: "",
    description: "",
    status: true,
    permission_ids: [],
  };
}

export function toRoleInput(role: Role): RoleInput {
  return {
    name: role.name,
    description: role.description,
    status: role.is_active,
    permission_ids: role.permissions.map((item) => item.id),
  };
}

export function groupedRolePermissions(role: Role) {
  const groups = new Map<
    string,
    { name: string; code: string; permissions: RolePermission[] }
  >();

  for (const item of role.permissions) {
    const key = item.group?.id ?? item.code;
    const current = groups.get(key) ?? {
      name: item.group?.name ?? "Chức năng",
      code: item.group?.code ?? "",
      permissions: [],
    };
    current.permissions.push(item);
    groups.set(key, current);
  }

  return [...groups.values()];
}
