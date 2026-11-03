import type {
  CreateTripInput,
  TicketStatusHistory,
  Trip,
  TripCrewMember,
  TripTicket,
  TripTickets,
  TripTicketsResult,
  UpdateTicketInput,
} from "@/types/trips";
import { bookingRequest } from "@/service/booking-api";

function postJson<T>(path: string, body?: unknown) {
  return bookingRequest<T>(path, {
    method: "POST",
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

function patchJson<T>(path: string, body: unknown) {
  return bookingRequest<T>(path, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export function listTrips(
  companyUuid: string,
  routeUuid: string,
  date: string,
) {
  const params = new URLSearchParams({
    company_uuid: companyUuid,
    route_uuid: routeUuid,
    date,
  });
  return bookingRequest<Trip[]>(`/trips?${params.toString()}`);
}

export function createTrip(input: CreateTripInput) {
  return postJson<Trip>("/trips", input);
}

export function updateTrip(
  tripId: string,
  input: { departure_time?: string; seat_map_uuid?: string; note?: string },
) {
  return patchJson<Trip>(`/trips/${tripId}`, input);
}

export function cancelTrip(tripId: string) {
  return postJson<{ trip: Trip; tickets: TripTicket[] }>(
    `/trips/${tripId}/cancel`,
  );
}

export function assignTripVehicle(tripId: string, vehiclePlate: string) {
  return patchJson<Trip>(`/trips/${tripId}/vehicle`, {
    vehicle_plate: vehiclePlate,
  });
}

export function assignTripCrew(
  tripId: string,
  crew: {
    driver_name: TripCrewMember[];
    assistant_name: TripCrewMember[];
  },
) {
  return patchJson<Trip>(`/trips/${tripId}/crew`, crew);
}

export function listTripHistories(tripId: string) {
  return bookingRequest<TicketStatusHistory[]>(`/trips/${tripId}/histories`);
}

export function listTripTickets(tripId: string) {
  return bookingRequest<TripTickets>(`/trips/${tripId}/tickets`);
}

export function issueTripTickets(tripId: string, ticketIds: string[]) {
  return postJson<TripTicketsResult>(`/trips/${tripId}/tickets/issue`, {
    ticket_ids: ticketIds,
  });
}

export function cancelTripTickets(tripId: string, ticketIds: string[]) {
  return postJson<TripTicketsResult>(`/trips/${tripId}/tickets/cancel`, {
    ticket_ids: ticketIds,
  });
}

export function moveTripTickets(
  tripId: string,
  moves: { from_ticket_id: string; to_ticket_id: string }[],
) {
  return postJson<TripTicketsResult>(`/trips/${tripId}/tickets/move`, {
    moves,
  });
}

export function updateTicket(ticketId: string, input: UpdateTicketInput) {
  return bookingRequest<TripTicket>(`/tickets/${ticketId}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function listTicketHistories(ticketId: string) {
  return bookingRequest<TicketStatusHistory[]>(`/tickets/${ticketId}/histories`);
}
