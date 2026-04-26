import { createClient } from "@/lib/supabase/server";
import { MembersClient } from "./MembersClient";

export default async function MembersPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return <MembersClient userId={user!.id} />;
}
