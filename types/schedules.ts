import type { Company } from "@/types/companies";

export type WeekdayMode = "all" | "custom";

export type ScheduleRoute = {
  id: string;
  route_code: string;
  name: string;
  origin: string;
  destination: string;
};

export type ScheduleSeatMap = {
  id: string;
  seat_map_code: string;
  name: string;
  layout_type: string;
};

export type Schedule = {
  id: string;
  company_uuid: string;
  company: Company;
  route_uuid: string;
  route: ScheduleRoute;
  seat_map_uuid: string;
  seat_map: ScheduleSeatMap;
  start_date: string;
  end_date: string;
  departure_time: string;
  weekday_mode: WeekdayMode;
  weekdays: number[];
  note: string;
  status: boolean;
  created_at: string;
  updated_at: string;
};

export type ScheduleInput = {
  route_uuid: string;
  seat_map_uuid: string;
  start_date: string;
  end_date: string;
  departure_time: string;
  weekday_mode: WeekdayMode;
  weekdays: number[];
  note: string;
  status: boolean;
};

export type SchedulePayload = ScheduleInput;
