"use client";

import { useEffect, useMemo, useState } from "react";
import { PencilIcon, PlusIcon, SearchIcon, Trash2Icon } from "lucide-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAuthStore } from "@/features/auth/stores/auth.store";
import { useOffices } from "@/features/office/hooks/use-offices";
import { VehicleFormDialog } from "@/features/vehicle/components/vehicle-form-dialog";
import { useVehicles } from "@/features/vehicle/hooks/use-vehicles";
import { deleteVehicle } from "@/features/vehicle/services/vehicle.service";
import type { Vehicle } from "@/features/vehicle/types/vehicle.types";
import {
  vehicleConditionLabel,
  vehicleStatusLabel,
  vehicleStatusVariant,
} from "@/features/vehicle/utils/vehicle-input";
import { toast } from "@/lib/toast";

export function VehiclesPage() {
  // Rendered inside DashboardShell, which only shows pages once the session is loaded.
  const companyUuid = useAuthStore((state) => state.account?.company_uuid ?? null);
  const { vehicles, loading, error: loadError, reload } = useVehicles(companyUuid);
  const { offices, error: officesError } = useOffices(companyUuid);
  const [query, setQuery] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Vehicle | null>(null);
  const [deleting, setDeleting] = useState<Vehicle | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!companyUuid) {
      toast.warning(
        "Tài khoản chưa gắn với nhà xe.",
        "Chưa khai báo được phương tiện.",
      );
    }
  }, [companyUuid]);

  useEffect(() => {
    if (loadError) {
      toast.fromError(loadError, "Không tải được danh sách phương tiện.");
    }
  }, [loadError]);

  useEffect(() => {
    if (officesError) {
      toast.fromError(officesError, "Không tải được danh sách chi nhánh.");
    }
  }, [officesError]);

  const filteredVehicles = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    if (!keyword) {
      return vehicles;
    }

    return vehicles.filter((vehicle) =>
      [
        vehicle.license_plate,
        vehicle.engine_number,
        vehicle.chassis_number,
        vehicle.brand,
        vehicle.owner_name,
        vehicle.office?.name ?? "",
        vehicleStatusLabel(vehicle.status),
      ]
        .join(" ")
        .toLowerCase()
        .includes(keyword),
    );
  }, [vehicles, query]);

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(vehicle: Vehicle) {
    setEditing(vehicle);
    setFormOpen(true);
  }

  async function handleDelete() {
    if (!deleting || !companyUuid) {
      return;
    }

    setPending(true);
    try {
      await deleteVehicle(deleting.id);
      toast.success("Đã xóa phương tiện.", deleting.license_plate);
      await reload();
    } catch (error: unknown) {
      toast.fromError(error, "Không xóa được phương tiện. Vui lòng thử lại.");
    } finally {
      setDeleting(null);
      setPending(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-800">
          Phương tiện
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Khai báo danh sách xe của nhà xe: thông tin định danh, thông số kỹ thuật, nguồn
          gốc sở hữu và tình trạng sử dụng.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative min-w-0 max-w-sm flex-1">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Tìm biển số, số khung, nhãn hiệu, chi nhánh..."
            className="pl-8"
          />
        </div>
        <Button onClick={openCreate} disabled={!companyUuid}>
          <PlusIcon />
          Thêm phương tiện
        </Button>
      </div>

      <div className="overflow-hidden rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Biển số</TableHead>
              <TableHead>Số chỗ</TableHead>
              <TableHead>Nhãn hiệu</TableHead>
              <TableHead>Năm SX</TableHead>
              <TableHead>Chi nhánh</TableHead>
              <TableHead>Tình trạng</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead className="w-24 text-right">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                  Đang tải danh sách phương tiện...
                </TableCell>
              </TableRow>
            ) : filteredVehicles.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                  {vehicles.length === 0
                    ? "Chưa có phương tiện nào. Bấm Thêm phương tiện để khai báo."
                    : "Không tìm thấy phương tiện phù hợp."}
                </TableCell>
              </TableRow>
            ) : (
              filteredVehicles.map((vehicle) => (
                <TableRow key={vehicle.id}>
                  <TableCell className="font-medium uppercase">
                    {vehicle.license_plate}
                  </TableCell>
                  <TableCell>{vehicle.seat_count || "—"}</TableCell>
                  <TableCell>{vehicle.brand || "—"}</TableCell>
                  <TableCell>{vehicle.manufacture_year ?? "—"}</TableCell>
                  <TableCell>{vehicle.office?.name ?? "—"}</TableCell>
                  <TableCell>{vehicleConditionLabel(vehicle.condition)}</TableCell>
                  <TableCell>
                    <Badge variant={vehicleStatusVariant(vehicle.status)}>
                      {vehicleStatusLabel(vehicle.status)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon-sm" onClick={() => openEdit(vehicle)}>
                        <PencilIcon />
                        <span className="sr-only">Sửa {vehicle.license_plate}</span>
                      </Button>
                      <Button variant="ghost" size="icon-sm" onClick={() => setDeleting(vehicle)}>
                        <Trash2Icon />
                        <span className="sr-only">Xóa {vehicle.license_plate}</span>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <VehicleFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        editing={editing}
        offices={offices}
        onSaved={reload}
      />

      <AlertDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => {
          if (!open) {
            setDeleting(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa phương tiện?</AlertDialogTitle>
            <AlertDialogDescription>
              Phương tiện {deleting?.license_plate} sẽ bị xóa khỏi hệ thống.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => void handleDelete()}
              disabled={pending}
            >
              {pending ? "Đang xóa..." : "Xóa"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
