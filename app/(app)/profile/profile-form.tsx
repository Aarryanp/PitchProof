"use client";

import { useActionState, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import type { PortfolioItem, Student } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { saveProfile, type SaveState } from "./actions";

const SKILLS = [
  { value: "web", label: "Web development" },
  { value: "design", label: "Design" },
];
const GOALS = [
  { value: "internship", label: "Internship" },
  { value: "freelance", label: "Freelance work" },
  { value: "job", label: "Job" },
];

type Item = Omit<PortfolioItem, "id"> & { key: number };

export function ProfileForm({ student, portfolio, readOnly }: { student: Student; portfolio: PortfolioItem[]; readOnly: boolean }) {
  const [state, action, pending] = useActionState<SaveState, FormData>(saveProfile, null);
  const [items, setItems] = useState<Item[]>(
    (portfolio.length ? portfolio : [{ title: "", skill_tag: "web", link: "", image_url: "", one_line: "" } as PortfolioItem]).map((p, i) => ({ ...p, key: i })),
  );
  const voices = [0, 1, 2].map((i) => student.voice_samples[i] ?? "");

  return (
    <form action={action} className="flex max-w-3xl flex-col gap-6">
      <fieldset disabled={readOnly} className="contents">
        <Card>
          <CardHeader>
            <CardTitle>About you</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <Field label="Name" htmlFor="name">
              <Input id="name" name="name" defaultValue={student.name} required />
            </Field>
            <Field label="City" htmlFor="city">
              <Input id="city" name="city" defaultValue={student.city ?? ""} placeholder="Nagpur" />
            </Field>
            <Field label="Year, or graduate" htmlFor="year_or_grad">
              <Input id="year_or_grad" name="year_or_grad" defaultValue={student.year_or_grad ?? ""} placeholder="3rd year" />
            </Field>
            <Field label="Photo link" htmlFor="photo_url">
              <Input id="photo_url" name="photo_url" type="url" defaultValue={student.photo_url ?? ""} placeholder="https://…" />
            </Field>
            <Field label="One line about you" htmlFor="bio" className="sm:col-span-2">
              <Textarea id="bio" name="bio" defaultValue={student.bio ?? ""} className="min-h-16" placeholder="CS student in Nagpur. I build fast, simple websites." />
            </Field>
            <div className="flex flex-col gap-2">
              <span className="text-sm font-medium">What you&apos;re looking for</span>
              <div className="flex flex-wrap gap-2">
                {GOALS.map((g) => (
                  <Chip key={g.value} type="radio" name="goal" value={g.value} label={g.label} defaultChecked={student.goal === g.value} />
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-sm font-medium">Skills you offer</span>
              <div className="flex flex-wrap gap-2">
                {SKILLS.map((s) => (
                  <Chip key={s.value} type="checkbox" name="skill_types" value={s.value} label={s.label} defaultChecked={student.skill_types.includes(s.value)} />
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Past projects</CardTitle>
            <CardDescription>Add 3–6. The agent picks the 2–3 that fit each company.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {items.map((it, i) => (
              <div key={it.key} className="grid gap-3 rounded-md border p-3 sm:grid-cols-[1fr_11rem]">
                <Input name="item_title" placeholder="Project name" defaultValue={it.title} aria-label="Project name" />
                <select
                  name="item_skill"
                  defaultValue={it.skill_tag ?? "web"}
                  aria-label="Skill"
                  className="h-9 rounded-md border bg-background px-2 text-sm"
                >
                  {SKILLS.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
                <Input name="item_line" placeholder="One line: what you made and the result" defaultValue={it.one_line ?? ""} className="sm:col-span-2" aria-label="One line" />
                <Input name="item_link" type="url" placeholder="Link (https://…)" defaultValue={it.link ?? ""} aria-label="Link" />
                <Input name="item_image" type="url" placeholder="Image link" defaultValue={it.image_url ?? ""} aria-label="Image link" />
                {items.length > 1 && !readOnly && (
                  <button
                    type="button"
                    onClick={() => setItems(items.filter((_, j) => j !== i))}
                    className="flex items-center gap-1 justify-self-start text-xs text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="size-3.5" /> Remove
                  </button>
                )}
              </div>
            ))}
            {items.length < 6 && !readOnly && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="self-start"
                onClick={() => setItems([...items, { key: Date.now(), title: "", skill_tag: "web", link: "", image_url: "", one_line: "" }])}
              >
                <Plus /> Add a project
              </Button>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>How you write</CardTitle>
            <CardDescription>
              Paste 2–3 short messages you&apos;ve written yourself (WhatsApp, email, anything). The email drafts copy your tone.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {voices.map((v, i) => (
              <Textarea key={i} name="voice_samples" defaultValue={v} placeholder={`Message ${i + 1}`} aria-label={`Message ${i + 1}`} />
            ))}
          </CardContent>
        </Card>
      </fieldset>

      {!readOnly && (
        <div className="flex items-center gap-3">
          <Button type="submit" disabled={pending}>
            {pending ? "Saving…" : "Save profile"}
          </Button>
          {state && <p className={cn("text-sm", state.ok ? "text-muted-foreground" : "text-destructive")}>{state.message}</p>}
        </div>
      )}
    </form>
  );
}

function Field({ label, htmlFor, className, children }: { label: string; htmlFor: string; className?: string; children: React.ReactNode }) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
    </div>
  );
}

function Chip({ label, ...props }: React.ComponentProps<"input"> & { label: string }) {
  return (
    <label className="cursor-pointer">
      <input className="peer sr-only" {...props} />
      <span className="inline-block rounded-full border px-3 py-1 text-sm text-muted-foreground transition-colors peer-checked:border-primary peer-checked:bg-primary/5 peer-checked:text-primary peer-focus-visible:ring-2 peer-focus-visible:ring-ring/50">
        {label}
      </span>
    </label>
  );
}
