"use client";

import { useCallback, useEffect, useState } from "react";

import { listRoles } from "@/features/permission/services/role.service";
import type { Role } from "@/features/permission/types/role.types";

/**
 * Roles of the signed-in company. The API takes the company from the access token;
 * `companyUuid` only gates loading (nothing is loaded while it is null) and reloads on change.
 */
export function useRoles(companyUuid: string | null) {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loadedFor, setLoadedFor] = useState<string | null>(null);
  const [error, setError] = useState<unknown>(null);

  useEffect(() => {
    if (!companyUuid) {
      return;
    }

    let cancelled = false;
    listRoles()
      .then((data) => {
        if (!cancelled) {
          setRoles(data);
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
          setLoadedFor(companyUuid);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [companyUuid]);

  /** Reloads after a create, update or delete; errors are left to the caller. */
  const reload = useCallback(async () => {
    if (!companyUuid) {
      return;
    }
    setRoles(await listRoles());
  }, [companyUuid]);

  return {
    roles,
    loading: companyUuid !== null && loadedFor !== companyUuid,
    error,
    reload,
  };
}
