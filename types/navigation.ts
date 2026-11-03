import type { LucideIcon } from "lucide-react";

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
