import Link from "next/link";

type ProfileStatCardProps = {
  label: string;
  value: string | number;
  subValue?: string;
  href?: string;
};

export function ProfileStatCard({
  label,
  value,
  subValue,
  href,
}: ProfileStatCardProps) {
  const content = (
    <div className="bg-foreground/5 hover:bg-foreground/10 rounded-xl p-4 text-center transition-colors">
      <p className="text-gold-300 text-2xl font-bold">{value}</p>
      <p className="text-foreground/60 mt-1 text-sm">{label}</p>
      {subValue && (
        <p className="text-foreground/40 mt-0.5 truncate text-xs">{subValue}</p>
      )}
    </div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }
  return content;
}
