"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type SaveState = { ok: boolean; message: string } | null;

const text = (v: FormDataEntryValue | null) => {
  const s = String(v ?? "").trim();
  return s.length ? s : null;
};

// Saves the Profile screen: the student row, their voice samples and their
// past projects. Projects are replaced as a set each time (simplest for 3–6 items).
export async function saveProfile(_prev: SaveState, form: FormData): Promise<SaveState> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return { ok: false, message: "Sign in to save your profile." };
  const userId = data.user.id;

  const name = text(form.get("name"));
  if (!name) return { ok: false, message: "Add your name." };

  const goal = text(form.get("goal"));
  const { error } = await supabase.from("students").upsert({
    id: userId,
    name,
    bio: text(form.get("bio")),
    photo_url: text(form.get("photo_url")),
    year_or_grad: text(form.get("year_or_grad")),
    goal: goal === "internship" || goal === "freelance" || goal === "job" ? goal : null,
    skill_types: form.getAll("skill_types").map(String),
    city: text(form.get("city")),
    voice_samples: form.getAll("voice_samples").map((v) => String(v).trim()).filter(Boolean),
  });
  if (error) return { ok: false, message: error.message };

  const titles = form.getAll("item_title").map(String);
  const items = titles
    .map((title, i) => ({
      student_id: userId,
      title: title.trim(),
      skill_tag: text(form.getAll("item_skill")[i]),
      link: text(form.getAll("item_link")[i]),
      image_url: text(form.getAll("item_image")[i]),
      one_line: text(form.getAll("item_line")[i]),
    }))
    .filter((it) => it.title);

  const del = await supabase.from("portfolio_items").delete().eq("student_id", userId);
  if (del.error) return { ok: false, message: del.error.message };
  if (items.length) {
    const ins = await supabase.from("portfolio_items").insert(items);
    if (ins.error) return { ok: false, message: ins.error.message };
  }

  revalidatePath("/profile");
  return { ok: true, message: "Profile saved." };
}
