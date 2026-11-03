import type { Point, PointInput, PointType } from "@/types/points";

export const POINT_TYPES: readonly {
  value: PointType;
  label: string;
  description: string;
}[] = [
  {
    value: "BEN_TAU",
    label: "Bến tàu",
    description: "Nơi hành khách lên hoặc xuống tàu, phà hoặc tàu cao tốc.",
  },
  {
    value: "BEN_XE",
    label: "Bến xe",
    description: "Bến xe khách tập trung, phục vụ nhiều tuyến và nhà xe.",
  },
  {
    value: "DIA_DANH",
    label: "Địa danh",
    description: "Địa điểm hoặc mốc nổi tiếng được sử dụng để xác định vị trí đón, trả.",
  },
  {
    value: "DOC_DUONG",
    label: "Dọc đường",
    description: "Điểm đón hoặc trả nằm trên tuyến đường, không phải bến xe hay văn phòng.",
  },
  {
    value: "KHU_VUC",
    label: "Khu vực",
    description: "Một khu vực hoặc phạm vi địa lý được sử dụng để xác định vị trí tương đối.",
  },
  {
    value: "NHA_GA",
    label: "Nhà ga",
    description: "Nhà ga đường sắt hoặc khu vực phục vụ hành khách đi và đến bằng tàu hỏa.",
  },
  {
    value: "SAN_BAY",
    label: "Sân bay",
    description: "Cảng hàng không hoặc khu vực đón, trả hành khách tại sân bay.",
  },
  {
    value: "VAN_PHONG",
    label: "Văn phòng",
    description: "Văn phòng hoặc chi nhánh của nhà xe, thường được sử dụng làm điểm đón, trả.",
  },
  {
    value: "TRAM_DUNG_CHAN",
    label: "Trạm dừng chân",
    description: "Địa điểm xe dừng nghỉ trong hành trình, thường có khu vực nghỉ ngơi và dịch vụ cho hành khách.",
  },
];

export function pointTypeLabel(value?: string | null) {
  return POINT_TYPES.find((item) => item.value === value)?.label ?? value ?? "—";
}

export function emptyPointInput(): PointInput {
  return {
    point_code: "",
    name: "",
    point_type: "",
    province_uuid: "",
    ward_uuid: "",
    address: "",
    note: "",
    status: true,
  };
}

export function toPointInput(point: Point): PointInput {
  return {
    point_code: point.point_code.toUpperCase(),
    name: point.name,
    point_type: point.point_type ?? "",
    province_uuid: point.province_uuid ?? "",
    ward_uuid: point.ward_uuid ?? "",
    address: point.address,
    note: point.note,
    status: point.status,
  };
}
