import Link from "next/link";
import { AdminPageHeader } from "../../_components/AdminPageHeader";

const Header = () => {
  return (
    <AdminPageHeader
      title="Find Players"
      description="Search and manage players in the database"
      actions={
        <Link
          href="/admin/add-player"
          className="bg-gold hover:bg-gold-light rounded-lg px-6 py-3 font-semibold text-black transition-colors"
        >
          + Add Player
        </Link>
      }
    />
  );
};
export default Header;
