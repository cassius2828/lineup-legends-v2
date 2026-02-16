import Link from "next/link";

const Header = () => {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Find Players</h1>
          <p className="mt-1 text-white/50">
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
