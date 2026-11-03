import {
  TicketStatus,
  type TripCrewMember,
  type TripTicket,
} from "@/types/trips";

export function tripCrewNames(members: TripCrewMember[]) {
  return members.map((member) => member.full_name).filter(Boolean).join(", ");
}

export function formatTripTime(value?: string) {
  const match = value?.trim().match(/^(\d{1,2}):(\d{2})/);
  if (!match) {
    return "";
  }

  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (
    !Number.isInteger(hour) ||
    !Number.isInteger(minute) ||
    hour < 0 ||
    hour > 23 ||
    minute < 0 ||
    minute > 59
  ) {
    return "";
  }

  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

export function formatTripDate(value: string) {
  const date = value.slice(0, 10);
  const [year, month, day] = date.split("-");
  if (!year || !month || !day) {
    return date || "—";
  }
  return `${day}/${month}/${year}`;
}

const OCCUPIED_TICKET_STATUSES = new Set<string>([
  TicketStatus.HELD,
  TicketStatus.BOOKED,
  TicketStatus.CONFIRMED,
  TicketStatus.CHECKED_IN,
  TicketStatus.COMPLETED,
  TicketStatus.NO_SHOW,
]);

export function isOccupiedTicket(status?: string | null) {
  return Boolean(status && OCCUPIED_TICKET_STATUSES.has(status));
}

export function isAvailableTicket(status?: string | null) {
  return status === TicketStatus.AVAILABLE || !status;
}

export function ticketStatusLabel(status?: string | null) {
  switch (status) {
    case TicketStatus.AVAILABLE:
      return "Trống";
    case TicketStatus.HELD:
      return "Đang giữ";
    case TicketStatus.BOOKED:
      return "Đã đặt";
    case TicketStatus.CONFIRMED:
      return "Đã xác nhận";
    case TicketStatus.CHECKED_IN:
      return "Đã lên xe";
    case TicketStatus.COMPLETED:
      return "Hoàn thành";
    case TicketStatus.CANCELLED:
      return "Đã hủy";
    case TicketStatus.EXPIRED:
      return "Hết hạn";
    case TicketStatus.NO_SHOW:
      return "Không đến";
    default:
      return "—";
  }
}

export function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function mergeTickets(current: TripTicket[], changed: TripTicket[]) {
  const byId = new Map(changed.map((ticket) => [ticket.id, ticket]));
  return current.map((ticket) => byId.get(ticket.id) ?? ticket);
}
