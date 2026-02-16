import Link from "next/link";

const HeaderNav = () => {
  return (
    <Link
      href="/"
      className="group font-stencil text-2xl tracking-wide text-foreground uppercase"
    >
      <span className="text-gold group-hover:text-gold-light transition-colors">
        Lineup
      </span>{" "}
      <span className="transition-colors group-hover:text-foreground/90">
        Legends
      </span>
    </Link>
  );
};
export default HeaderNav;
