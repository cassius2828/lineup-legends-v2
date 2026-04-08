import Link from "next/link";

const HeaderNav = () => {
  return (
    <Link
      href="/"
      className="group font-stencil text-foreground text-2xl tracking-wide uppercase"
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
