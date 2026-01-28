import Link from "next/link";

const HeaderNav = () => {
  return (
    <Link
      href="/"
      className="group font-stencil text-2xl tracking-wide text-white uppercase"
    >
      <span className="text-gold group-hover:text-gold-light transition-colors">
        Lineup
      </span>{" "}
      <span className="transition-colors group-hover:text-white/90">
        Legends
      </span>
    </Link>
  );
};
export default HeaderNav;
