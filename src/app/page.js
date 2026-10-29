import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Banner from "@/Components/Banner";
import { verifySession } from "@/lib/session";

export default async function Home({ searchParams }) {
  const params = await searchParams;
  const accountUnavailable =
    params?.reason === "account-unavailable";

  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;

  // Allow the login/signup page to render after account deactivation.
  if (!accountUnavailable && token) {
    const session = await verifySession(token);

    if (session?.sub) {
      redirect("/dashboard");
    }
  }

  return (
    <Banner
      accountUnavailable={accountUnavailable}
    />
  );
}