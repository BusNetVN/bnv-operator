"use client";

import { useEffect, useMemo, useState } from "react";

import { listPermissionCatalog } from "@/features/permission/services/permission.service";
import type { PermissionGroup } from "@/features/permission/types/permission.types";
import { activePermissionCatalog } from "@/features/permission/utils/permission-catalog";

/** Active permission groups (with only their active permissions) that can be granted to roles. */
export function usePermissionCatalog(enabled = true) {
  const [groups, setGroups] = useState<PermissionGroup[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<unknown>(null);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    let cancelled = false;
    listPermissionCatalog()
      .then((data) => {
        if (!cancelled) {
          setGroups(data);
          setError(null);
        }
      })
      .catch((caught: unknown) => {
        if (!cancelled) {
          setError(caught);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoaded(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [enabled]);

  const catalog = useMemo(() => activePermissionCatalog(groups), [groups]);

  return { catalog, loading: enabled && !loaded, error };
}
