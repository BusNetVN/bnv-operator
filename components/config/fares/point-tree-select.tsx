"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDownIcon, ChevronRightIcon, SearchIcon } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { cn } from "cn";

export type FareStopPoint = {
  id: string;
  name: string;
  provinceName: string;
  wardName: string;
  sortOrder: number;
};

const MISSING_PROVINCE = "Chưa gắn tỉnh";
const MISSING_WARD = "Chưa gắn xã";

function normalizeSearch(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function buildTree(points: FareStopPoint[], query: string) {
  const keyword = normalizeSearch(query);
  const filtered = keyword
    ? points.filter((point) =>
        normalizeSearch(
          `${point.provinceName} ${point.wardName} ${point.name}`,
        ).includes(keyword),
      )
    : points;

  const provinces = new Map<string, Map<string, FareStopPoint[]>>();
  for (const point of filtered) {
    const province = point.provinceName || MISSING_PROVINCE;
    const ward = point.wardName || MISSING_WARD;
    const wards = provinces.get(province) ?? new Map<string, FareStopPoint[]>();
    const wardPoints = wards.get(ward) ?? [];
    wardPoints.push(point);
    wards.set(ward, wardPoints);
    provinces.set(province, wards);
  }

  return [...provinces.entries()]
    .sort(([left], [right]) => left.localeCompare(right, "vi"))
    .map(([province, wards]) => ({
      province,
      wards: [...wards.entries()]
        .sort(([left], [right]) => left.localeCompare(right, "vi"))
        .map(([ward, wardPoints]) => ({
          ward,
          points: [...wardPoints].sort(
            (left, right) => left.sortOrder - right.sortOrder,
          ),
        })),
    }));
}

function checkState(ids: string[], selected: Set<string>) {
  const count = ids.filter((id) => selected.has(id)).length;
  if (count === 0) {
    return "none" as const;
  }
  if (count === ids.length) {
    return "all" as const;
  }
  return "some" as const;
}

export function PointTreeSelect({
  value,
  points,
  onValueChange,
  disabled,
  invalid,
}: {
  value: string[];
  points: FareStopPoint[];
  onValueChange: (pointIds: string[]) => void;
  disabled?: boolean;
  invalid?: boolean;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const selected = useMemo(() => new Set(value), [value]);
  const tree = useMemo(() => buildTree(points, query), [points, query]);
  const selectedTree = useMemo(
    () => buildTree(points.filter((point) => selected.has(point.id)), ""),
    [points, selected],
  );
  const searching = normalizeSearch(query).length > 0;

  useEffect(() => {
    if (!open) {
      setQuery("");
      setCollapsed(new Set());
      return;
    }
    function handlePointer(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handlePointer);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handlePointer);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  function toggleBranch(key: string) {
    setCollapsed((current) => {
      const next = new Set(current);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }

  function togglePoints(ids: string[]) {
    const next = new Set(value);
    const allSelected = ids.every((id) => next.has(id));
    for (const id of ids) {
      if (allSelected) {
        next.delete(id);
      } else {
        next.add(id);
      }
    }
    onValueChange([...next]);
  }

  return (
    <div
      ref={rootRef}
      className={cn("w-full min-w-44", disabled && "pointer-events-none opacity-50")}
    >
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-expanded={open}
        aria-invalid={invalid || undefined}
        onClick={() => setOpen((current) => !current)}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            setOpen((current) => !current);
          }
        }}
        className="min-h-16 cursor-pointer rounded-lg bg-background px-2 py-1.5 ring-1 ring-foreground/10 outline-none aria-invalid:ring-destructive focus-visible:ring-ring"
      >
        <div className="flex flex-col gap-3">
          {selectedTree.map((province) => (
            <div key={province.province}>
              <div className="text-xs font-bold tracking-wide text-blue-600 uppercase">
                {province.province}
              </div>
              <div className="mt-0.5 flex flex-col">
                {province.wards.map((ward) => (
                  <div
                    key={`${province.province}/${ward.ward}`}
                    className="text-sm leading-5 text-slate-600"
                  >
                    <span className="font-semibold text-slate-800">{ward.ward}</span>
                    {ward.points.map((point) => (
                      <span key={point.id}>
                        <span className="mx-1 text-slate-400">•</span>
                        {point.name}
                      </span>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
      {open ? (
        <div className="mt-1 overflow-hidden rounded-lg bg-popover text-popover-foreground shadow-md ring-1 ring-foreground/10">
          <div className="relative border-b p-1.5">
            <SearchIcon className="pointer-events-none absolute top-1/2 left-3.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Tìm tỉnh, xã, điểm..."
              className="h-8 pl-7"
            />
          </div>
          <div className="max-h-72 overflow-y-auto p-1">
            {tree.length === 0 ? (
              <p className="px-2 py-2 text-sm text-muted-foreground">
                Không tìm thấy điểm.
              </p>
            ) : (
              tree.map((province) => {
                const provinceKey = province.province;
                const provinceOpen = searching || !collapsed.has(provinceKey);
                const provinceIds = province.wards.flatMap((ward) =>
                  ward.points.map((point) => point.id),
                );
                const provinceState = checkState(provinceIds, selected);
                return (
                  <div key={provinceKey}>
                    <div className="flex items-center gap-1 rounded-md px-1 py-1 hover:bg-accent">
                      <button
                        type="button"
                        className="flex size-5 shrink-0 items-center justify-center text-muted-foreground"
                        aria-label={provinceOpen ? "Thu gọn tỉnh" : "Mở rộng tỉnh"}
                        onClick={() => toggleBranch(provinceKey)}
                      >
                        {provinceOpen ? (
                          <ChevronDownIcon className="size-3.5" />
                        ) : (
                          <ChevronRightIcon className="size-3.5" />
                        )}
                      </button>
                      <Checkbox
                        checked={provinceState === "all"}
                        indeterminate={provinceState === "some"}
                        onCheckedChange={() => togglePoints(provinceIds)}
                        aria-label={province.province}
                        className="data-indeterminate:border-primary data-indeterminate:bg-primary data-indeterminate:text-primary-foreground data-indeterminate:before:absolute data-indeterminate:before:h-0.5 data-indeterminate:before:w-2 data-indeterminate:before:rounded-full data-indeterminate:before:bg-current data-indeterminate:[&_svg]:hidden"
                      />
                      <button
                        type="button"
                        className="min-w-0 flex-1 truncate text-left text-sm font-medium"
                        onClick={() => togglePoints(provinceIds)}
                      >
                        {province.province}
                      </button>
                    </div>
                    {provinceOpen
                      ? province.wards.map((ward) => {
                          const wardKey = `${provinceKey}/${ward.ward}`;
                          const wardOpen = searching || !collapsed.has(wardKey);
                          const wardIds = ward.points.map((point) => point.id);
                          const wardState = checkState(wardIds, selected);
                          return (
                            <div key={wardKey}>
                              <div className="flex items-center gap-1 rounded-md py-1 pr-1 pl-6 hover:bg-accent">
                                <button
                                  type="button"
                                  className="flex size-5 shrink-0 items-center justify-center text-muted-foreground"
                                  aria-label={wardOpen ? "Thu gọn xã" : "Mở rộng xã"}
                                  onClick={() => toggleBranch(wardKey)}
                                >
                                  {wardOpen ? (
                                    <ChevronDownIcon className="size-3.5" />
                                  ) : (
                                    <ChevronRightIcon className="size-3.5" />
                                  )}
                                </button>
                                <Checkbox
                                  checked={wardState === "all"}
                                  indeterminate={wardState === "some"}
                                  onCheckedChange={() => togglePoints(wardIds)}
                                  aria-label={ward.ward}
                                  className="data-indeterminate:border-primary data-indeterminate:bg-primary data-indeterminate:text-primary-foreground data-indeterminate:before:absolute data-indeterminate:before:h-0.5 data-indeterminate:before:w-2 data-indeterminate:before:rounded-full data-indeterminate:before:bg-current data-indeterminate:[&_svg]:hidden"
                                />
                                <button
                                  type="button"
                                  className="min-w-0 flex-1 truncate text-left text-sm"
                                  onClick={() => togglePoints(wardIds)}
                                >
                                  {ward.ward}
                                </button>
                              </div>
                              {wardOpen
                                ? ward.points.map((point) => (
                                    <div
                                      key={point.id}
                                      className="flex items-center gap-2 rounded-md py-1 pr-2 pl-14 hover:bg-accent"
                                    >
                                      <Checkbox
                                        checked={selected.has(point.id)}
                                        onCheckedChange={() =>
                                          togglePoints([point.id])
                                        }
                                        aria-label={point.name}
                                      />
                                      <button
                                        type="button"
                                        className="min-w-0 flex-1 truncate text-left text-sm"
                                        onClick={() => togglePoints([point.id])}
                                      >
                                        {point.name}
                                      </button>
                                    </div>
                                  ))
                                : null}
                            </div>
                          );
                        })
                      : null}
                  </div>
                );
              })
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
