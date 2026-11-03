import Image from "next/image";
import { cn } from "@/lib/utils";
import logo from "@/assets/image/logo.png";

type BrandLogoProps = {
  className?: string;
  priority?: boolean;
};

export function BrandLogo({ className, priority = false }: BrandLogoProps) {
  return (
    <Image
      src={logo}
      alt="BusNetVN"
      className={cn("h-auto w-[168px]", className)}
      sizes="168px"
      priority={priority}
    />
  );
}
