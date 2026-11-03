"use client";

import { useEffect, useMemo, useState } from "react";
import { PackagePlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CreateReinforcementTripDialog } from "@/components/ticket-sales/create-reinforcement-trip-dialog";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { SolarLunarDatePicker } from "@/components/ticket-sales/solar-lunar-date-picker";
import { useAuthStore } from "@/features/auth/stores/auth.store";
import type { Route } from "@/types/routes";
import { itineraryLabel } from "@/lib/routes";
import { listRoutes } from "@/service/routes";
import { toast } from "@/lib/toast";
import { TripWorkspace } from "@/components/ticket-sales/trip-workspace";
import type { Trip, TripTicket } from "@/types/trips";
import { formatTripTime, isOccupiedTicket, tripCrewNames } from "@/lib/trips";
import { listTripTickets, listTrips } from "@/service/trips";

function todayIso() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function TicketSalesPage() {
  const [companyUuid, setCompanyUuid] = useState<string | null>(null);
  const [date, setDate] = useState(todayIso);
  const [routeId, setRouteId] = useState("");
  const [routes, setRoutes] = useState<Route[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loadingRoutes, setLoadingRoutes] = useState(true);
  const [loadingTrips, setLoadingTrips] = useState(false);
  const [selectedTripId, setSelectedTripId] = useState<string | null>(null);
  const [tripTickets, setTripTickets] = useState<TripTicket[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(false);
  const [reinforcementDialogOpen, setReinforcementDialogOpen] = useState(false);

  const isToday = date === todayIso();

  const activeRoutes = useMemo(
    () => routes.filter((route) => route.status),
    [routes],
  );
  const routeItems = useMemo(
    () =>
      activeRoutes.map((route) => ({
        value: route.id,
        label: route.name || itineraryLabel(route),
        description: itineraryLabel(route),
      })),
    [activeRoutes],
  );

  useEffect(() => {
    const account = useAuthStore.getState().account;
    const companyId = account?.company_uuid ?? null;
    setCompanyUuid(companyId);

    if (!companyId) {
      setLoadingRoutes(false);
      toast.warning(
        "Tài khoản chưa gắn với nhà xe.",
        "Chưa tải được danh sách tuyến.",
      );
      return;
    }

    listRoutes(companyId)
      .then((data) => setRoutes(data))
      .catch((error: unknown) => {
        toast.fromError(error, "Không tải được danh sách tuyến.");
      })
      .finally(() => setLoadingRoutes(false));
  }, []);

  useEffect(() => {
    if (!companyUuid || !routeId || !date) {
      setTrips([]);
      setSelectedTripId(null);
      setTripTickets([]);
      setLoadingTrips(false);
      return;
    }

    let cancelled = false;
    setLoadingTrips(true);
    listTrips(companyUuid, routeId, date)
      .then((data) => {
        if (!cancelled) {
          setTrips(data);
          setSelectedTripId((current) => {
            if (
              current &&
              data.some((trip) => trip.id === current && trip.status)
            ) {
              return current;
            }
            setTripTickets([]);
            return null;
          });
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setTrips([]);
          setSelectedTripId(null);
          setTripTickets([]);
          toast.fromError(error, "Không tải được danh sách chuyến.");
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoadingTrips(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [companyUuid, date, routeId]);

  const activeTrips = trips.filter((trip) => trip.status);
  const selectedTrip =
    activeTrips.find((trip) => trip.id === selectedTripId) ?? null;
  const selectedRoute = routes.find((route) => route.id === routeId) ?? null;

  function handleToday() {
    setDate(todayIso());
  }

  async function handleSelectTrip(tripId: string) {
    if (selectedTripId === tripId) {
      setSelectedTripId(null);
      setTripTickets([]);
      return;
    }

    setSelectedTripId(tripId);
    setTripTickets([]);
    setLoadingTickets(true);
    try {
      const data = await listTripTickets(tripId);
      setSelectedTripId((current) => {
        if (current === tripId) {
          setTripTickets(data.tickets);
        }
        return current;
      });
    } catch (error: unknown) {
      setSelectedTripId((current) => {
        if (current === tripId) {
          setTripTickets([]);
          toast.fromError(error, "Không tải được sơ đồ ghế của chuyến.");
          return null;
        }
        return current;
      });
    } finally {
      setLoadingTickets(false);
    }
  }

  return (
    <div className="mx-auto w-full rounded-xl border bg-card p-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Button
          type="button"
          variant={isToday ? "default" : "outline"}
          onClick={handleToday}
        >
          Hôm nay
        </Button>

        <SolarLunarDatePicker
          key={date}
          value={date}
          onValueChange={setDate}
        />

        <SearchableSelect
          value={routeId}
          items={routeItems}
          onValueChange={setRouteId}
          disabled={!companyUuid || loadingRoutes}
          placeholder={loadingRoutes ? "Đang tải tuyến..." : "Chọn tuyến"}
          searchPlaceholder="Tìm tuyến..."
          className="sm:max-w-sm sm:flex-1"
        />
        {routeId && date ? (
          <Button
            type="button"
            variant="outline"
            className="w-full sm:w-auto"
            onClick={() => setReinforcementDialogOpen(true)}
          >
            <PackagePlusIcon />
            Tăng cường chuyến
          </Button>
        ) : null}
      </div>

      {routeId ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {loadingTrips ? (
            <p className="text-sm text-muted-foreground">
              Đang tải danh sách chuyến...
            </p>
          ) : activeTrips.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Không có chuyến cho ngày và tuyến này.
            </p>
          ) : (
            activeTrips.map((trip) => (
              <button
                key={trip.id}
                type="button"
                onClick={() => handleSelectTrip(trip.id)}
                aria-pressed={selectedTripId === trip.id}
                className={`flex w-40 shrink-0 flex-col gap-1.5 rounded-lg border bg-background p-2 text-left outline-none transition-colors hover:bg-muted/50 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 ${
                  selectedTripId === trip.id
                    ? "border-primary ring-2 ring-primary/20"
                    : ""
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="text-lg leading-none font-semibold tabular-nums">
                    {formatTripTime(trip.departure_time) || "—"}
                  </span>
                  <span className="text-sm leading-none tabular-nums">
                    <span className="text-red-500">
                      {trip.booked_seat_count ?? 0}
                    </span>
                    <span className="text-muted-foreground">
                      /{trip.seat_count ?? 0}
                    </span>
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="flex min-w-0 items-center gap-1.5 text-sm">
                    <span
                      className={`size-1.5 shrink-0 rounded-full ${
                        trip.vehicle_plate
                          ? "bg-emerald-500"
                          : "bg-muted-foreground/40"
                      }`}
                    />
                    <span className="truncate">
                      {trip.vehicle_plate || "—"}
                    </span>
                  </span>
                  <span className="shrink-0 text-sm uppercase">
                    {trip.seat_map.seat_map_code || "—"}
                  </span>
                </div>
                <div className="min-w-0">
                  <p className="truncate text-xs">
                    {tripCrewNames(trip.driver_name) || "—"}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {tripCrewNames(trip.assistant_name) || "—"}
                  </p>
                </div>
              </button>
            ))
          )}
        </div>
      ) : null}

      {selectedTrip ? (
        <TripWorkspace
          key={selectedTrip.id}
          trip={selectedTrip}
          tickets={tripTickets}
          loadingTickets={loadingTickets}
          onTripChange={(next) => {
            if (!next.status) {
              setTrips((current) =>
                current.filter((trip) => trip.id !== next.id),
              );
              setSelectedTripId((current) =>
                current === next.id ? null : current,
              );
              setTripTickets([]);
              return;
            }

            setTrips((current) =>
              current.map((trip) => (trip.id === next.id ? next : trip)),
            );
          }}
          onTicketsChange={(nextTickets) => {
            setTripTickets(nextTickets);
            const booked = nextTickets.filter((ticket) =>
              isOccupiedTicket(ticket.status),
            ).length;
            setTrips((current) =>
              current.map((trip) =>
                trip.id === selectedTrip.id
                  ? { ...trip, booked_seat_count: booked }
                  : trip,
              ),
            );
          }}
        />
      ) : null}

      {companyUuid && selectedRoute && date ? (
        <CreateReinforcementTripDialog
          open={reinforcementDialogOpen}
          onOpenChange={setReinforcementDialogOpen}
          companyUuid={companyUuid}
          route={selectedRoute}
          date={date}
          onCreated={(createdTrip) =>
            setTrips((current) =>
              [...current, createdTrip].sort((left, right) =>
                left.departure_time.localeCompare(right.departure_time),
              ),
            )
          }
        />
      ) : null}
    </div>
  );
}
