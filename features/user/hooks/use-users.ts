"use client";

import { useCallback, useEffect, useState } from "react";

import { listUsers } from "@/features/user/services/user.service";
import type { User } from "@/features/user/types/user.types";

/**
 * Staff accounts of the signed-in company. The API takes the company from the access token;
 * `companyUuid` only gates loading (nothing is loaded while it is null) and reloads on change.
 */
export function useUsers(companyUuid: string | null) {
  const [users, setUsers] = useState<User[]>([]);
  const [loadedFor, setLoadedFor] = useState<string | null>(null);
  const [error, setError] = useState<unknown>(null);

  useEffect(() => {
    if (!companyUuid) {
      return;
    }

    let cancelled = false;
    listUsers()
      .then((data) => {
        if (!cancelled) {
          setUsers(data);
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

  /** Reloads after a change; errors are left to the caller. */
  const reload = useCallback(async () => {
    if (!companyUuid) {
      return;
    }
    setUsers(await listUsers());
  }, [companyUuid]);

  return {
    users,
    loading: companyUuid !== null && loadedFor !== companyUuid,
    error,
    reload,
  };
}
