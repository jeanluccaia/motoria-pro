import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function GET() {
  const jar = await cookies();
  jar.delete("dgn_admin_session");
  redirect("/admin/growth/login");
}
