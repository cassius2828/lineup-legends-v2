import HeaderNav from "./HeaderNav";
import DesktopNav from "./DesktopNav";
import MobileNav from "./MobileNav";

const Nav = () => {
  return (
    <nav className="border-gold/10 bg-background shadow-gold fixed top-0 z-50 w-full border-b shadow-sm backdrop-blur-xl">
      <div className="via-gold/30 absolute right-0 bottom-0 left-0 h-px bg-gradient-to-r from-transparent to-transparent" />

      <div className="flex w-full items-center justify-between px-4 py-4 sm:px-6">
        <HeaderNav />
        <DesktopNav />
        <MobileNav />
      </div>
    </nav>
  );
};
export default Nav;
