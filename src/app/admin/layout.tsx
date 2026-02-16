import { redirect } from "next/navigation";
import { auth } from "~/server/auth";
import { AdminSidebar } from "./components/AdminSidebar";

const AdminLayout = async ({ children }: { children: React.ReactNode }) => {
  const session = await auth();
  if (!session?.user?.admin) {
    redirect("/unauthorized");
  }

  return (
    <div className="admin-layout flex min-h-screen bg-[#0a0a1a]">
      <AdminSidebar />
      <main className="flex-1 overflow-y-auto md:ml-64">
        <div className="mx-auto max-w-7xl p-4 md:p-8">{children}</div>
      </main>
    </div>
  );
};

export default AdminLayout;
