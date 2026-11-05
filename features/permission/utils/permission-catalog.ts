import type { PermissionGroup } from "@/features/permission/types/permission.types";

export function activePermissionCatalog(groups: PermissionGroup[]) {
  return groups
    .filter((group) => group.is_active)
    .map((group) => ({
      ...group,
      permissions: group.permissions.filter((item) => item.is_active),
    }))
    .filter((group) => group.permissions.length > 0);
}
