export type FareSegment = {
  origin_point_uuid: string;
  origin_name: string;
  destination_point_uuid: string;
  destination_name: string;
  price: number;
};

export type FareRoute = {
  id: string;
  route_code: string;
  name: string;
  origin: string;
  destination: string;
};

export type FareSchedule = {
  id: string;
  departure_time: string;
  start_date: string;
  end_date: string;
};

export type FareSeatMap = {
  id: string;
  seat_map_code: string;
  name: string;
};

export type Fare = {
  id: string;
  company_uuid: string;
  route_uuid: string;
  route: FareRoute;
  schedule_uuid: string | null;
  schedule: FareSchedule | null;
  seat_map_uuid: string | null;
  seat_map: FareSeatMap | null;
  priority: boolean;
  start_date: string;
  end_date: string;
  weekdays: number[];
  segments: FareSegment[];
  created_at: string;
  updated_at: string;
};

export type FarePointRef = {
  id: string;
  name: string;
};

export type FareSegmentInput = {
  row_key: string;
  origins: FarePointRef[];
  destinations: FarePointRef[];
  price: string;
};

export type FareInput = {
  route_uuid: string;
  schedule_uuid: string;
  seat_map_uuid: string;
  priority: boolean;
  start_date: string;
  end_date: string;
  weekdays: number[];
  segments: FareSegmentInput[];
};

export type FarePayload = {
  company_uuid?: string;
  route_uuid: string;
  schedule_uuid?: string;
  seat_map_uuid?: string;
  priority: boolean;
  start_date: string;
  end_date: string;
  weekdays: number[];
  segments: {
    origin_point_uuid: string;
    destination_point_uuid: string;
    price: number;
  }[];
};
