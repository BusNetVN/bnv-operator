"use client";

import { Checkbox } from "@/components/ui/checkbox";
import type { PermissionGroup } from "@/features/permission/types/permission.types";

type PermissionChecklistProps = {
  groups: PermissionGroup[];
  /** Ids of the selected permissions. */
  value: string[];
  onChange: (ids: string[]) => void;
  emptyText?: string;
};

/** Permissions grouped by permission group; a group checkbox toggles all of its permissions. */
export function PermissionChecklist({
  groups,
  value,
  onChange,
  emptyText = "Chưa có chức năng do hệ thống cung cấp.",
}: PermissionChecklistProps) {
  if (groups.length === 0) {
    return <p className="text-sm text-muted-foreground">{emptyText}</p>;
  }

  const selected = new Set(value);

  function togglePermission(id: string) {
    const next = new Set(selected);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    onChange([...next]);
  }

  function toggleGroup(group: PermissionGroup) {
    const ids = group.permissions.map((item) => item.id);
    const next = new Set(selected);
    const allSelected = ids.every((id) => next.has(id));
    for (const id of ids) {
      if (allSelected) {
        next.delete(id);
      } else {
        next.add(id);
      }
    }
    onChange([...next]);
  }

  return (
    <div className="grid gap-3 rounded-lg border p-3">
      {groups.map((group) => {
        const ids = group.permissions.map((item) => item.id);
        const selectedCount = ids.filter((id) => selected.has(id)).length;
        const allSelected = ids.length > 0 && selectedCount === ids.length;

        return (
          <div key={group.id} className="grid gap-2">
            <label className="flex items-center gap-2 text-sm font-medium">
              <Checkbox
                checked={allSelected}
                onCheckedChange={() => toggleGroup(group)}
                aria-label={`Chọn tất cả chức năng ${group.name}`}
              />
              <span>{group.name}</span>
              <span className="font-mono text-xs font-normal uppercase text-muted-foreground">
                {group.code}
              </span>
            </label>
            <div className="grid gap-2 border-l pl-5">
              {group.permissions.map((item) => (
                <label key={item.id} className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={selected.has(item.id)}
                    onCheckedChange={() => togglePermission(item.id)}
                  />
                  <span>{item.name}</span>
                  <span className="font-mono text-xs text-muted-foreground">
                    {item.code}
                  </span>
                </label>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
