"use server";

import { createClient } from "@/lib/supabase/server";

export type SearchState = { ok: boolean; message: string } | null;

// Screen 3: saves the search. Running the agent (steps 1–4) is added once
// those scripts work, so for now this only records what to look for.
export async function startSearch(_prev: SearchState, form: FormData): Promise<SearchState> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return { ok: false, message: "Sign in to run a search." };

  const { data: student } = await supabase.from("students").select("id").eq("id", data.user.id).maybeSingle();
  if (!student) return { ok: false, message: "Save your profile first, so the agent knows what you offer." };

  const count = Math.min(20, Math.max(1, Number(form.get("count")) || 10));
  const { error } = await supabase.from("searches").insert({
    student_id: data.user.id,
    skill_type: String(form.get("skill_type") ?? "web"),
    sector: String(form.get("sector") ?? "").trim() || null,
    city: String(form.get("city") ?? "").trim() || null,
    count,
  });
  if (error) return { ok: false, message: error.message };
  return { ok: true, message: `Search saved. The agent will look for ${count} businesses once steps 1–4 are connected.` };
}
