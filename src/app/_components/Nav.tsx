import Image from "next/image"
import Link from "next/link"
import { auth } from "~/server/auth"
const Nav = async () => {
    const session = await auth()
    return (
        <nav className="fixed top-0 z-50 w-full border-b border-gold/10 bg-black/90 backdrop-blur-xl">
            {/* Gold accent line at bottom of nav */}
            <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold/30 to-transparent" />

            <div className="container mx-auto flex items-center justify-between px-4 py-4">
                <Link href="/" className="group font-stencil text-2xl uppercase tracking-wide text-white">
                    <span className="text-gold transition-colors group-hover:text-gold-light">Lineup</span>{" "}
                    <span className="transition-colors group-hover:text-white/90">Legends</span>
                </Link>
                <div className="flex items-center gap-6">
                    <Link
                        href="/lineups/new"
                        className="hidden text-white/90 transition-colors hover:text-gold sm:block capitalize"
                    >
                        create a lineup
                    </Link>
                    {session ? (
                        <>
                            <Link
                                href="/lineups"
                                className="hidden text-white/90 transition-colors hover:text-gold sm:block capitalize"
                            >
                                My Lineups
                            </Link>
                            <Link
                                href="/lineups/explore"
                                className="hidden text-white/90 transition-colors hover:text-gold sm:block capitalize"
                            >
                                Explore
                            </Link>
                            <Link
                                href={`/profile/${session.user.id}`}
                                className="flex items-center gap-2 transition-opacity hover:opacity-80"
                            >
                                {session.user.image && (
                                    <Image
                                        src={session.user.image}
                                        alt={session.user.name ?? "User"}
                                        className=" rounded-full ring-2 ring-gold/20"
                                        width={32}
                                        height={32}
                                    />
                                )}
                                <span className="hidden text-sm text-white/60 sm:block">
                                    {session.user.name}
                                </span>
                            </Link>
                            <Link
                                href="/api/auth/signout"
                                className="rounded-none border border-white/20 bg-transparent px-4 py-2 text-sm font-medium text-white/90 transition-all hover:border-gold/50 hover:bg-gold/10 hover:text-white capitalize"
                            >
                                Sign Out
                            </Link>
                        </>
                    ) : (
                        <>
                            <Link
                                href="/api/auth/signin"
                                className="text-white/90 transition-colors hover:text-gold capitalize"
                            >
                                Sign up
                            </Link>
                            <Link
                                href="/api/auth/signin"
                                className="rounded-none border-2 border-gold bg-gold/10 px-4 py-2 text-sm font-medium text-white/90 transition-all hover:bg-gold hover:glow-gold-sm capitalize"
                            >
                                Sign in
                            </Link>
                        </>
                    )}
                </div>
            </div>
        </nav>
    )
}
export default Nav