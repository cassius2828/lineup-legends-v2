import Link from "next/link";

const HeaderNav = () => {
  return (
    <Link
      href="/"
      className="group font-stencil text-foreground shrink-0 text-2xl tracking-wide whitespace-nowrap uppercase"
    >
      <span className="text-gold group-hover:text-gold-light transition-colors">
        Lineup
      </span>{" "}
      <span className="group-hover:text-foreground/90 transition-colors">
        Legends
      </span>
    </Link>
  );
};
export default HeaderNav;
