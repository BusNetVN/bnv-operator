import { identityRequest } from "@/lib/identity";
import type { Permission } from "@/lib/permissions";

export type RolePermission = Permission & {
  group: {
    id: string;
    code: string;
    name: string;
  } | null;
};

export type Role = {
  id: string;
  company_uuid: string;
  code: string;
  name: string;
  description: string;
  sort_order: number;
  status: boolean;
  permissions: RolePermission[];
  created_at: string;
  updated_at: string;
};

export type RoleInput = {
  name: string;
  description: string;
  status: boolean;
  permission_ids: string[];
};

export type RolePayload = RoleInput;

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
    status: role.status,
    permission_ids: role.permissions.map((item) => item.id),
  };
}

export function toRolePayload(values: RoleInput): RolePayload {
  return {
    name: values.name.trim(),
    description: values.description.trim(),
    status: values.status,
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

export function listRoles(companyUuid: string, query?: string) {
  const params = new URLSearchParams({ company_uuid: companyUuid });
  const keyword = query?.trim();
  if (keyword) {
    params.set("q", keyword);
  }

  return identityRequest<Role[]>(`/roles?${params.toString()}`);
}

export function createRole(companyUuid: string, input: RolePayload) {
  return identityRequest<Role>("/roles", {
    method: "POST",
    body: JSON.stringify({
      ...input,
      company_uuid: companyUuid,
    }),
  });
}

export function updateRole(id: string, input: RolePayload) {
  return identityRequest<Role>(`/roles/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function deleteRole(id: string) {
  return identityRequest<{ id: string; code: string; name: string }>(
    `/roles/${id}`,
    { method: "DELETE" },
  );
}
