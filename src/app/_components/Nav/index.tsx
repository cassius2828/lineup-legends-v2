import { auth } from "~/server/auth";
import HeaderNav from "./HeaderNav";
import DesktopNav from "./DesktopNav";
import MobileNav from "./MobileNav";

const Nav = async () => {
  const session = await auth();
  return (
    <nav className="border-gold/10 fixed top-0 z-50 w-full border-b bg-black/90 backdrop-blur-xl">
      {/* Gold accent line at bottom of nav */}
      <div className="via-gold/30 absolute right-0 bottom-0 left-0 h-px bg-gradient-to-r from-transparent to-transparent" />

      <div className="container mx-auto flex items-center justify-between px-4 py-4">
        <HeaderNav />
        <DesktopNav session={session} />
        <MobileNav session={session} />
      </div>
    </nav>
  );
};
export default Nav;
