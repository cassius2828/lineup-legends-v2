import Link from "next/link";

const Header = () => {
  return (
    <div className="mb-8">
      <Link
        href="/"
        className="mb-4 inline-flex items-center gap-1 text-sm text-white/60 hover:text-white/80"
      >
        <svg
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 19l-7-7 7-7"
          />
        </svg>
        Back to Home
      </Link>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Find Players</h1>
          <p className="mt-2 text-white/60">
            Search and manage players in the database
          </p>
        </div>
        <Link
          href="/admin/add-player"
          className="bg-gold hover:bg-gold-light rounded-lg px-6 py-3 font-semibold text-black transition-colors"
        >
          + Add Player
        </Link>
      </div>
    </div>
  );
};
export default Header;
