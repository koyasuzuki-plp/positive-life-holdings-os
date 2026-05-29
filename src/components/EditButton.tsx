import Link from "next/link";

type EditButtonProps = {
  href: string;
  label?: string;
};

export function EditButton({ href, label = "編集" }: EditButtonProps) {
  return (
    <Link
      href={href}
      className="shrink-0 rounded-md px-2 py-1 text-[11px] font-medium text-muted-foreground active:bg-muted"
    >
      {label}
    </Link>
  );
}
