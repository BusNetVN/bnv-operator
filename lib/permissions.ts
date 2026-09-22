import { identityRequest } from "@/lib/identity";

export type Permission = {
  id: string;
  code: string;
  name: string;
  description: string;
  sort_order: number;
  status: boolean;
  created_at?: string;
  updated_at?: string;
};

export type PermissionGroup = {
  id: string;
  code: string;
  name: string;
  description: string;
  sort_order: number;
  status: boolean;
  permissions: Permission[];
  created_at?: string;
  updated_at?: string;
};

export function listPermissionCatalog() {
  return identityRequest<PermissionGroup[]>("/permission-groups");
}

export function activePermissionCatalog(groups: PermissionGroup[]) {
  return groups
    .filter((group) => group.status)
    .map((group) => ({
      ...group,
      permissions: group.permissions.filter((item) => item.status),
    }))
    .filter((group) => group.permissions.length > 0);
}
