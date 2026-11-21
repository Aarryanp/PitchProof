"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { emailPasses } from "@/lib/pitch-rules";

// Server actions for the Pitch review screen. Each one checks who is signed
// in (row-level security only lets a student change their own pitches).
// Approving does NOT send yet: sending through Gmail is step 9.

export type ActionResult = { ok: boolean; message: string };

type Draft = { subject: string; body: string; personalLine: string };

async function signedIn() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  return data.user ? supabase : null;
}

export async function saveDraft(id: string, draft: Draft): Promise<ActionResult> {
  const supabase = await signedIn();
  if (!supabase) return { ok: false, message: "Sign in to save changes." };
  const { error } = await supabase
    .from("pitches")
    .update({ email_subject: draft.subject, email_body: draft.body, personal_line: draft.personalLine || null })
    .eq("id", id)
    .eq("status", "draft");
  if (error) return { ok: false, message: error.message };
  revalidatePath(`/pitch/${id}`);
  return { ok: true, message: "Saved." };
}

export async function approvePitch(id: string, draft: Draft): Promise<ActionResult> {
  const supabase = await signedIn();
  if (!supabase) return { ok: false, message: "Sign in to approve." };
  if (!emailPasses(draft.body)) return { ok: false, message: "Fix the email checks first." };
  const { error } = await supabase
    .from("pitches")
    .update({
      email_subject: draft.subject,
      email_body: draft.body,
      personal_line: draft.personalLine || null,
      status: "approved",
      approved_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("status", "draft");
  if (error) return { ok: false, message: error.message };
  revalidatePath("/pipeline");
  revalidatePath(`/pitch/${id}`);
  return { ok: true, message: "Approved. It will be sent once Gmail sending is built." };
}

export async function skipPitch(id: string): Promise<ActionResult> {
  const supabase = await signedIn();
  if (!supabase) return { ok: false, message: "Sign in to skip." };
  const { error } = await supabase.from("pitches").update({ status: "skipped" }).eq("id", id).eq("status", "draft");
  if (error) return { ok: false, message: error.message };
  revalidatePath("/pipeline");
  return { ok: true, message: "Skipped." };
}
