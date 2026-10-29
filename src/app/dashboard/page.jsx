
import DashboardPage from "@/Components/DashboardPage";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import User from "@/models/User";
import { verifySession } from "@/lib/session";

export default async function Dashboard() {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;

  if (!token) {
    redirect("/");
  }

  const session = await verifySession(token);

  if (!session?.sub) {
    redirect("/");
  }

  const user = await User.findByPk(session.sub, {
    attributes: ["id", "name", "email", "role"],
  });

  if (!user) {
    redirect("/");
  }

  return (
    <main>
      <DashboardPage
        user={user.name}
        email={user.email}
        userRole={user.role}
      />
    </main>
  );
}
