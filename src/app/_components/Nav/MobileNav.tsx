"use client";

import type { Session } from "next-auth";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import Hamburger from "./Hamburger";

const MobileNav = ({ session }: { session: Session | null }) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const closeMenu = () => {
    setIsOpen(false);
  };

  return (
    <div className="relative flex w-full justify-end md:hidden">
      {/* Hamburger Button */}
      <Hamburger toggleMenu={toggleMenu} isOpen={isOpen} />

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <>
          <div className="fixed z-40" onClick={closeMenu} />
          <div className="border-gold/10 fixed top-0 right-0 z-40 h-full w-full border-l backdrop-blur-xl">
            <div className="flex flex-col gap-4 bg-black/90 p-6">
              {/* Close button */}
              <div className="flex items-center justify-between">
                <span className="font-stencil text-xl text-foreground uppercase">
                  Menu
                </span>
              </div>

              <div className="flex flex-col gap-4 pt-4">
                <Link
                  href="/players"
                  onClick={closeMenu}
                  className="hover:text-gold text-foreground/90 capitalize transition-colors"
                >
                  Players
                </Link>
                <Link
                  href="/lineups/new"
                  onClick={closeMenu}
                  className="hover:text-gold text-foreground/90 capitalize transition-colors"
                >
                  create a lineup
                </Link>
                <Link
                  href="/contact"
                  onClick={closeMenu}
                  className="hover:text-gold text-foreground/90 capitalize transition-colors"
                >
                  Contact
                </Link>

                {session ? (
                  <>
                    <Link
                      href="/lineups"
                      onClick={closeMenu}
                      className="hover:text-gold text-foreground/90 capitalize transition-colors"
                    >
                      My Lineups
                    </Link>
                    <Link
                      href="/lineups/explore"
                      onClick={closeMenu}
                      className="hover:text-gold text-foreground/90 capitalize transition-colors"
                    >
                      Explore
                    </Link>
                    <Link
                      href="/users/search"
                      onClick={closeMenu}
                      className="hover:text-gold text-foreground/90 capitalize transition-colors"
                    >
                      Find Users
                    </Link>
                    {session.user.admin && (
                      <Link
                        href="/admin"
                        onClick={closeMenu}
                        className="text-gold/80 hover:text-gold font-medium capitalize transition-colors"
                      >
                        Admin Dashboard
                      </Link>
                    )}
                    <div className="border-t border-foreground/10 pt-4">
                      <Link
                        href={`/profile/${session.user.id}`}
                        onClick={closeMenu}
                        className="flex items-center gap-3 transition-opacity hover:opacity-80"
                      >
                        {session.user.image && (
                          <Image
                            src={session.user.image}
                            alt={session.user.name ?? "User"}
                            className="ring-gold/20 rounded-full ring-2"
                            width={40}
                            height={40}
                          />
                        )}
                        <span className="text-foreground/90">
                          {session.user.name}
                        </span>
                      </Link>
                    </div>
                    <Link
                      href="/api/auth/signout"
                      onClick={closeMenu}
                      className="hover:border-gold/50 hover:bg-gold/10 rounded-none border border-foreground/20 bg-transparent px-4 py-2 text-sm font-medium text-foreground/90 capitalize transition-all hover:text-foreground"
                    >
                      Sign Out
                    </Link>
                  </>
                ) : (
                  <>
                    <Link
                      href="/api/auth/signin"
                      onClick={closeMenu}
                      className="hover:text-gold text-foreground/90 capitalize transition-colors"
                    >
                      Sign up
                    </Link>
                    <Link
                      href="/api/auth/signin"
                      onClick={closeMenu}
                      className="border-gold bg-gold/10 hover:bg-gold hover:text-black hover:glow-gold-sm rounded-none border-2 px-4 py-2 text-center text-sm font-medium text-foreground/90 capitalize transition-all"
                    >
                      Sign in
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default MobileNav;
