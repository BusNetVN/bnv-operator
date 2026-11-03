export type PointType =
  | "BEN_TAU"
  | "BEN_XE"
  | "DIA_DANH"
  | "DOC_DUONG"
  | "KHU_VUC"
  | "NHA_GA"
  | "SAN_BAY"
  | "VAN_PHONG"
  | "TRAM_DUNG_CHAN";

export type Point = {
  id: string;
  company_uuid: string | null;
  scope: "SYSTEM" | "COMPANY";
  shared: boolean;
  point_code: string;
  name: string;
  point_type: PointType | "";
  province_uuid: string | null;
  province_name: string | null;
  ward_uuid: string | null;
  ward_name: string | null;
  address: string;
  note: string;
  status: boolean;
  created_at: string;
  updated_at: string;
};

export type PointInput = {
  point_code: string;
  name: string;
  point_type: PointType | "";
  province_uuid: string;
  ward_uuid: string;
  address: string;
  note: string;
  status: boolean;
};
