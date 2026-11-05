"use client";

import { useCallback, useEffect, useState } from "react";

import { listVehicles } from "@/features/vehicle/services/vehicle.service";
import type { Vehicle } from "@/features/vehicle/types/vehicle.types";

/**
 * Vehicles of the signed-in company. The API takes the company from the access token;
 * `companyUuid` only gates loading (nothing is loaded while it is null) and reloads on change.
 */
export function useVehicles(companyUuid: string | null) {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loadedFor, setLoadedFor] = useState<string | null>(null);
  const [error, setError] = useState<unknown>(null);

  useEffect(() => {
    if (!companyUuid) {
      return;
    }

    let cancelled = false;
    listVehicles()
      .then((data) => {
        if (!cancelled) {
          setVehicles(data);
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
    setVehicles(await listVehicles());
  }, [companyUuid]);

  return {
    vehicles,
    loading: companyUuid !== null && loadedFor !== companyUuid,
    error,
    reload,
  };
}
