import type { Session } from "next-auth";
import Image from "next/image";
import Link from "next/link";
import { IoIosLogOut } from "react-icons/io";
import { signOut } from "~/server/auth";
const DesktopNav = ({ session }: { session: Session | null }) => {
  return (
    <div className="hidden items-center gap-6 md:flex">
      <Link
        href="/lineups/new"
        className="hover:text-gold hidden text-white/90 capitalize transition-colors sm:block"
      >
        create a lineup
      </Link>

      {session ? (
        <>
          <Link
            href="/lineups"
            className="hover:text-gold hidden text-white/90 capitalize transition-colors sm:block"
          >
            My Lineups
          </Link>
          <Link
            href="/lineups/explore"
            className="hover:text-gold hidden text-white/90 capitalize transition-colors sm:block"
          >
            Explore
          </Link>
          <Link
            href="/contact"
            className="hover:text-gold hidden text-white/90 capitalize transition-colors sm:block"
          >
            Contact
          </Link>
          {session.user.admin && (
            <Link
              href="/admin"
              className="text-gold/80 hover:text-gold hidden text-sm font-medium capitalize transition-colors sm:block"
            >
              Admin
            </Link>
          )}
          <Link
            href={`/profile/${session.user.id}`}
            className="flex items-center gap-2 transition-opacity hover:opacity-80"
          >
            {session.user.image && (
              <Image
                src={session.user.image}
                alt={session.user.name ?? "User"}
                className="ring-gold/20 rounded-full ring-2"
                width={32}
                height={32}
              />
            )}
            <span className="hidden text-sm text-white/60 sm:block">
              {session.user.name}
            </span>
          </Link>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/" });
            }}
          >
            <button type="submit" className="cursor-pointer">
              <IoIosLogOut className="hover:text-gold text-2xl text-white transition-colors duration-100" />
            </button>
          </form>
        </>
      ) : (
        <>
          <Link
            href="/api/auth/signin"
            className="hover:text-gold text-white/90 capitalize transition-colors"
          >
            Sign up
          </Link>
          <Link
            href="/api/auth/signin"
            className="border-gold bg-gold/10 hover:bg-gold hover:glow-gold-sm rounded-none border-2 px-4 py-2 text-sm font-medium text-white/90 capitalize transition-all"
          >
            Sign in
          </Link>
        </>
      )}
    </div>
  );
};
export default DesktopNav;
