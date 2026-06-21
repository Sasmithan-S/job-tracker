import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import DashboardClient from "@/components/DashboardClient";

export default async function DashboardPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const [{ data: applications }, { data: emailConnection }] = await Promise.all([
    supabase.from("applications").select("*").eq("user_id", user.id).order("date_candidature", { ascending: false }),
    supabase.from("email_connections").select("*").eq("user_id", user.id).maybeSingle(),
  ]);

  return (
    <DashboardClient
      initialApplications={applications ?? []}
      initialEmailConnection={emailConnection}
      userEmail={user.email ?? ""}
    />
  );
}
