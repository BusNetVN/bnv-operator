import type {
  Role,
  RoleInput,
  RolePayload,
  RolePermission,
} from "@/types/roles";

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

export function toRolePayload(values: RoleInput): RolePayload {
  return {
    name: values.name.trim(),
    description: values.description.trim(),
    is_active: values.status,
    permission_ids: [...new Set(values.permission_ids)],
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
