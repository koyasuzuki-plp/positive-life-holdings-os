import Link from "next/link";

type BackLinkProps = {
  href?: string;
  label?: string;
};

export function BackLink({ href = "/", label = "今日に戻る" }: BackLinkProps) {
  return (
    <Link
      href={href}
      className="mb-2 inline-flex min-h-10 items-center text-sm font-medium text-primary active:opacity-70"
    >
      ← {label}
    </Link>
  );
}
