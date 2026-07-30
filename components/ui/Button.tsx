import Link from "next/link";

const BASE = "text-xs font-bold px-5 py-2.5 rounded transition disabled:opacity-50";
const VARIANTS = {
  primary: "bg-navy text-gold hover:opacity-90",
  secondary: "bg-white border border-hairline text-navy hover:bg-cream",
};

export function Button({
  children,
  variant = "primary",
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: keyof typeof VARIANTS }) {
  return (
    <button className={`${BASE} ${VARIANTS[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
}

export function LinkButton({
  href,
  children,
  variant = "primary",
  className = "",
}: {
  href: string;
  children: React.ReactNode;
  variant?: keyof typeof VARIANTS;
  className?: string;
}) {
  return (
    <Link href={href} className={`inline-block ${BASE} ${VARIANTS[variant]} ${className}`}>
      {children}
    </Link>
  );
}
