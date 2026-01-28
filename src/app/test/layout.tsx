import { redirect } from "next/navigation";
import { auth } from "~/server/auth";

const TestLayout = async ({ children }: { children: React.ReactNode }) => {
  const session = await auth();
  if (!session?.user?.admin) {
    redirect("/unauthorized");
  }
  return <>{children}</>;
};
export default TestLayout;
