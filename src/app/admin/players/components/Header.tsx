import Link from "next/link";

const Header = () => {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-foreground text-3xl font-bold">Find Players</h1>
          <p className="text-foreground/50 mt-1">
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
