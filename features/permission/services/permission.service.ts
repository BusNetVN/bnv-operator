import type { PermissionGroup } from "@/features/permission/types/permission.types";
import { coreRequest } from "@/service/core-api";

/** Active permission groups with their active permissions, to grant to roles. */
export function listPermissionCatalog() {
  return coreRequest<PermissionGroup[]>("/operator/permission-groups");
}
