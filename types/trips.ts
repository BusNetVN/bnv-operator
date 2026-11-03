export type TripCrewMember = {
  id: string | null;
  full_name: string;
  phone: string;
};

export type TripStatus = "SCHEDULED" | "READY" | "IN_PROGRESS" | "COMPLETED";

export type Trip = {
  id: string;
  company_uuid: string;
  route_uuid: string;
  schedule_uuid: string | null;
  seat_map_uuid: string;
  trip_date: string;
  departure_time: string;
  route: {
    id: string;
    route_code: string;
    name: string;
    origin: string;
    destination: string;
  };
  seat_map: {
    id: string;
    seat_map_code: string;
    name: string;
    layout_type: string;
  };
  seat_count: number;
  booked_seat_count: number;
  vehicle_plate: string;
  driver_name: TripCrewMember[];
  assistant_name: TripCrewMember[];
  note: string;
  status: boolean;
  trip_status: TripStatus;
};

export enum TicketStatus {
  AVAILABLE = "AVAILABLE",
  HELD = "HELD",
  BOOKED = "BOOKED",
  CONFIRMED = "CONFIRMED",
  CHECKED_IN = "CHECKED_IN",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
  EXPIRED = "EXPIRED",
  NO_SHOW = "NO_SHOW",
}

export type TripTicket = {
  id: string;
  company_uuid: string;
  trip_uuid: string;
  floor: number;
  row: number;
  col: number;
  seat_code: string;
  cell_type: "seat" | "empty";
  status: TicketStatus;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  pickup_location_uuid: string | null;
  pickup_name: string;
  dropoff_location_uuid: string | null;
  dropoff_name: string;
  note: string;
  base_price: number;
  discount_amount: number;
  final_price: number;
};

export type TripTickets = {
  trip_id: string;
  copied: boolean;
  tickets: TripTicket[];
};

export type UpdateTicketInput = {
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  pickup_name: string;
  dropoff_name: string;
  note: string;
  base_price: number;
  discount_amount: number;
  final_price: number;
};

export type TicketStatusHistory = {
  id: string;
  ticket_uuid: string;
  seat_code: string;
  from_status: TicketStatus | null;
  to_status: TicketStatus;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  pickup_name: string;
  dropoff_name: string;
  note: string;
  base_price: number;
  discount_amount: number;
  final_price: number;
  created_at: string;
};

export type CreateTripInput = {
  route_uuid: string;
  seat_map_uuid: string;
  trip_date: string;
  departure_time: string;
};

export type TripTicketsResult = {
  trip_id: string;
  tickets: TripTicket[];
};
