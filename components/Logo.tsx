import Image from "next/image";
import Link from "next/link";

interface LogoProps {
  height?: number;
  href?: string;
  style?: React.CSSProperties;
  priority?: boolean;
}

export default function Logo({ height = 44, href = "/", style, priority = false }: LogoProps) {
  const img = (
    <Image
      src="/logo-brand-official.png"
      alt="PetPass"
      width={160}
      height={height}
      priority={priority}
      style={{ height, width: "auto", objectFit: "contain", display: "block", ...style }}
    />
  );
  if (!href) return img;
  return (
    <Link href={href} style={{ display: "inline-block", textDecoration: "none" }}>
      {img}
    </Link>
  );
}
