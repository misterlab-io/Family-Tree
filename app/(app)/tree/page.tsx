import { createClient } from "@/lib/supabase/server";
import { FamilyTreeCanvas } from "@/components/tree/FamilyTreeCanvas";

export default async function TreePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="h-[calc(100vh-5rem)]">
      <FamilyTreeCanvas userId={user!.id} />
    </div>
  );
}
