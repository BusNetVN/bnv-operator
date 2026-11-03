"use client";

import { useCallback, useEffect, useState } from "react";

import { listOffices } from "@/features/office/services/office.service";
import type { Office } from "@/features/office/types/office.types";

/**
 * Offices of the signed-in company. The API takes the company from the access token;
 * `companyUuid` only gates loading (nothing is loaded while it is null) and reloads on change.
 */
export function useOffices(companyUuid: string | null) {
  const [offices, setOffices] = useState<Office[]>([]);
  const [loadedFor, setLoadedFor] = useState<string | null>(null);
  const [error, setError] = useState<unknown>(null);

  useEffect(() => {
    if (!companyUuid) {
      return;
    }

    let cancelled = false;
    listOffices()
      .then((data) => {
        if (!cancelled) {
          setOffices(data);
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
    setOffices(await listOffices());
  }, [companyUuid]);

  return {
    offices,
    loading: companyUuid !== null && loadedFor !== companyUuid,
    error,
    reload,
  };
}
