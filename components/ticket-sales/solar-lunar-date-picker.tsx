"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { SolarDate } from "@nghiavuive/lunar_date_vi";
import {
  CalendarDaysIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "cn";

type LunarDateValue = {
  day: number;
  month: number;
  year: number;
};

function parseDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day, 12);
}

function formatDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getLunarDate(date: Date): LunarDateValue | null {
  try {
    const lunar = new SolarDate({
      day: date.getDate(),
      month: date.getMonth() + 1,
      year: date.getFullYear(),
    })
      .toLunarDate()
      .get();
    return { day: lunar.day, month: lunar.month, year: lunar.year };
  } catch {
    return null;
  }
}

function formatSolarDate(date: Date) {
  const weekday = new Intl.DateTimeFormat("vi-VN", {
    weekday: "long",
  }).format(date);
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${weekday}, ${day}-${month}-${date.getFullYear()}`;
}

function formatLunarDate(date: LunarDateValue | null) {
  return date ? `${date.day}/${date.month}/${date.year} âm lịch` : "";
}

export function SolarLunarDatePicker({
  value,
  onValueChange,
}: {
  value: string;
  onValueChange: (value: string) => void;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const selectedDate = useMemo(() => parseDate(value), [value]);
  const [open, setOpen] = useState(false);
  const [visibleMonth, setVisibleMonth] = useState(
    () => new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1, 12),
  );
  const selectedLunarDate = useMemo(
    () => getLunarDate(selectedDate),
    [selectedDate],
  );

  useEffect(() => {
    if (!open) {
      return;
    }

    function handlePointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  const monthLabel = visibleMonth.toLocaleDateString("vi-VN", {
    month: "long",
    year: "numeric",
  });
  const calendarDays = useMemo(() => {
    const year = visibleMonth.getFullYear();
    const month = visibleMonth.getMonth();
    const firstWeekday = (new Date(year, month, 1, 12).getDay() + 6) % 7;
    const daysInMonth = new Date(year, month + 1, 0, 12).getDate();
    const cellCount = Math.ceil((firstWeekday + daysInMonth) / 7) * 7;

    return Array.from(
      { length: cellCount },
      (_, index) => new Date(year, month, index - firstWeekday + 1, 12),
    );
  }, [visibleMonth]);

  const today = new Date();
  const todayValue = formatDate(today);
  const weekdays = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

  function changeMonth(offset: number) {
    setVisibleMonth(
      (current) =>
        new Date(current.getFullYear(), current.getMonth() + offset, 1, 12),
    );
  }

  function selectDate(date: Date) {
    onValueChange(formatDate(date));
    setOpen(false);
  }

  return (
    <div ref={rootRef} className="relative w-full sm:w-60">
      <Button
        type="button"
        variant="outline"
        aria-label={`Chọn ngày, ${formatSolarDate(selectedDate)}`}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className="w-full justify-between gap-2 px-2.5"
      >
        <span className="flex min-w-0 items-center gap-2">
          <CalendarDaysIcon className="size-4 shrink-0 text-muted-foreground" />
          <span className="truncate text-left text-sm capitalize">
            {formatSolarDate(selectedDate)}
          </span>
        </span>
        <ChevronDownIcon className="size-4 shrink-0 text-muted-foreground" />
      </Button>

      {open ? (
        <div
          role="dialog"
          aria-label="Chọn ngày dương lịch và âm lịch"
          className="absolute top-full left-0 z-50 mt-2 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-xl border bg-popover text-popover-foreground shadow-lg"
        >
          <div className="flex items-center justify-between gap-2 border-b px-3 py-2.5">
            <p className="text-sm font-semibold capitalize">{monthLabel}</p>
            <div className="flex items-center gap-1">
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                title="Tháng trước"
                aria-label="Tháng trước"
                onClick={() => changeMonth(-1)}
              >
                <ChevronLeftIcon />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                title="Tháng sau"
                aria-label="Tháng sau"
                onClick={() => changeMonth(1)}
              >
                <ChevronRightIcon />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => selectDate(today)}
              >
                Hôm nay
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1 px-2 pt-2">
            {weekdays.map((weekday, index) => (
              <div
                key={weekday}
                className={cn(
                  "py-1 text-center text-xs font-medium text-muted-foreground",
                  index === 6 && "text-red-500",
                )}
              >
                {weekday}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1 p-2 pt-1">
            {calendarDays.map((day) => {
              const lunarDate = getLunarDate(day);
              const dayValue = formatDate(day);
              const isSelected = dayValue === value;
              const isToday = dayValue === todayValue;
              const isCurrentMonth =
                day.getMonth() === visibleMonth.getMonth();
              const isSunday = day.getDay() === 0;
              const lunarLabel = lunarDate
                ? lunarDate.day === 1
                  ? `1/${lunarDate.month}`
                  : String(lunarDate.day)
                : "";

              return (
                <button
                  key={dayValue}
                  type="button"
                  aria-label={`${day.getDate()} tháng ${day.getMonth() + 1} năm ${day.getFullYear()} dương lịch${lunarDate ? `, ${formatLunarDate(lunarDate)}` : ""}`}
                  aria-pressed={isSelected}
                  onClick={() => selectDate(day)}
                  className={cn(
                    "flex h-11 min-w-0 flex-col items-center justify-center rounded-md text-sm transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    isSelected && "bg-red-600 text-white hover:bg-red-700",
                    isToday && !isSelected && "ring-1 ring-red-500",
                    !isCurrentMonth &&
                      !isSelected &&
                      "text-muted-foreground/40",
                    isSunday && isCurrentMonth && !isSelected && "text-red-500",
                  )}
                >
                  <span className="leading-4">{day.getDate()}</span>
                  <span
                    className={cn(
                      "text-[10px] leading-3 text-sky-700",
                      lunarDate?.day === 1 && "font-semibold text-red-600",
                      isSelected && "text-white/80",
                      !isCurrentMonth && !isSelected && "text-muted-foreground/40",
                    )}
                  >
                    {lunarLabel}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center justify-between gap-2 border-t px-3 py-2 text-xs">
            <span className="font-medium">{formatSolarDate(selectedDate)}</span>
            <span className="shrink-0 text-sky-700">
              {formatLunarDate(selectedLunarDate)}
            </span>
          </div>
        </div>
      ) : null}
    </div>
  );
}