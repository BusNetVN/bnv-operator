import {
  BarChart3,
  ClipboardList,
  Globe,
  LayoutDashboard,
  Package,
  Ticket,
  Settings,
  type LucideIcon,
} from "lucide-react";

export type NavLeaf = {
  title: string;
  href: string;
};

export type NavItem = {
  title: string;
  icon: LucideIcon;
  href?: string;
  items?: NavLeaf[];
};

export const dashboardNav: NavItem[] = [
  {
    title: "Tổng quan",
    href: "/v1",
    icon: LayoutDashboard,
  },
  {
    title: "Bán vé",
    href: "/v1/ban-ve",
    icon: Ticket,
  },
  {
    title: "Hàng hóa",
    href: "/v1/hang-hoa",
    icon: Package,
  },
  {
    title: "Vé Online",
    href: "/v1/ve-online",
    icon: Globe,
  },
  {
    title: "Báo cáo",
    icon: BarChart3,
    items: [
      { title: "Doanh thu", href: "/v1/bao-cao/doanh-thu" },
      { title: "Bán vé", href: "/v1/bao-cao/ban-ve" },
      { title: "Hàng hóa", href: "/v1/bao-cao/hang-hoa" },
      { title: "Vé online", href: "/v1/bao-cao/ve-online" },
    ],
  },
  {
    title: "Khai báo",
    icon: ClipboardList,
    items: [
      { title: "Tuyến đường", href: "/v1/khai-bao/tuyen-duong" },
      { title: "Sơ đồ ghế", href: "/v1/khai-bao/so-do-ghe" },
      { title: "Nhân sự", href: "/v1/khai-bao/nhan-su" },
      { title: "Nhóm quyền", href: "/v1/khai-bao/nhom-quyen" },
      { title: "Giá vé", href: "/v1/khai-bao/gia-ve" },
      { title: "Văn phòng", href: "/v1/khai-bao/van-phong" },
    ],
  },
  {
    title: "Cấu hình",
    icon: Settings,
    items: [
      { title: "Lịch chạy", href: "/v1/cau-hinh/lich-chay" },
      { title: "Tuyến đường", href: "/v1/cau-hinh/tuyen-duong" },
      { title: "Bán vé", href: "/v1/cau-hinh/ban-ve" },
      { title: "Giá vé", href: "/v1/cau-hinh/gia-ve" },
    ]
  }
];

export function isNavActive(pathname: string, href: string) {
  if (href === "/v1") {
    return pathname === "/v1";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function findCurrentNavItem(pathname: string) {
  const leaves = dashboardNav.flatMap((item) =>
    item.items ?? (item.href ? [{ title: item.title, href: item.href }] : []),
  );

  return leaves
    .filter((item) => isNavActive(pathname, item.href))
    .sort((a, b) => b.href.length - a.href.length)[0];
}
