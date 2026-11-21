"use server";

import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";

// The company said no: mark the pitch declined (this hides the page and
// stops all follow-ups). Uses the server-only key because companies don't sign in.
export async function decline(slug: string) {
  if (slug !== "sample" && process.env.SUPABASE_SECRET_KEY) {
    await createAdminClient().from("pitches").update({ status: "declined" }).eq("page_slug", slug);
  }
  redirect(`/p/${slug}/no?done=1`);
}
