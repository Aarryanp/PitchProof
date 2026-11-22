"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Briefcase, Check, Code2, GraduationCap, Handshake, Palette, Plus, Trash2 } from "lucide-react";
import type { PortfolioItem, Student } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { saveProfile } from "@/app/(app)/profile/actions";

type Project = { title: string; one_line: string; link: string; skill_tag: string };

const GOALS = [
  { value: "freelance", label: "Freelance work", hint: "Paid projects for businesses", icon: Handshake },
  { value: "internship", label: "An internship", hint: "Learn on the job", icon: GraduationCap },
  { value: "job", label: "A job", hint: "A full-time role", icon: Briefcase },
];
const SKILLS = [
  { value: "web", label: "Web development", hint: "Fast, simple websites", icon: Code2 },
  { value: "design", label: "Design", hint: "Logos, layouts, brand basics", icon: Palette },
];

export function OnboardingFlow({ student, portfolio }: { student: Student; portfolio: PortfolioItem[] }) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  // Which way the screens slide: forward from the right, back from the left.
  const [dir, setDir] = useState<"fwd" | "back">("fwd");
  const [error, setError] = useState("");
  const [saving, startSaving] = useTransition();

  const [name, setName] = useState(student.name);
  const [city, setCity] = useState(student.city ?? "");
  const [year, setYear] = useState(student.year_or_grad ?? "");
  const [goal, setGoal] = useState(student.goal ?? "");
  const [skills, setSkills] = useState<string[]>(student.skill_types);
  const [bio, setBio] = useState(student.bio ?? "");
  const [projects, setProjects] = useState<Project[]>(
    portfolio.length
      ? portfolio.map((p) => ({ title: p.title, one_line: p.one_line ?? "", link: p.link ?? "", skill_tag: p.skill_tag ?? "web" }))
      : [{ title: "", one_line: "", link: "", skill_tag: "web" }],
  );
  const [voices, setVoices] = useState<string[]>([0, 1].map((i) => student.voice_samples[i] ?? ""));

  const steps = [
    {
      title: "What's your name?",
      hint: "Businesses see this on the page you send them.",
      ok: name.trim().length > 0,
      body: <Input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" className="h-12 text-base" />,
    },
    {
      title: "Where are you based?",
      hint: "Local businesses trust someone from their own city.",
      ok: city.trim().length > 0,
      body: (
        <div className="flex flex-col gap-3">
          <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="City, e.g. Nagpur" className="h-12 text-base" />
          <Input value={year} onChange={(e) => setYear(e.target.value)} placeholder="Year of study, or “graduate”" className="h-12 text-base" />
        </div>
      ),
    },
    {
      title: "What are you looking for?",
      hint: "This shapes how your emails end.",
      ok: goal !== "",
      body: (
        <div className="flex flex-col gap-3">
          {GOALS.map((g) => (
            <Choice key={g.value} {...g} selected={goal === g.value} onClick={() => setGoal(g.value)} />
          ))}
        </div>
      ),
    },
    {
      title: "What can you do for a business?",
      hint: "Pick one or both. The agent checks websites for these skills.",
      ok: skills.length > 0,
      body: (
        <div className="flex flex-col gap-3">
          {SKILLS.map((s) => (
            <Choice
              key={s.value}
              {...s}
              selected={skills.includes(s.value)}
              onClick={() => setSkills(skills.includes(s.value) ? skills.filter((x) => x !== s.value) : [...skills, s.value])}
            />
          ))}
        </div>
      ),
    },
    {
      title: "Describe yourself in one line",
      hint: "Plain and true works best.",
      ok: bio.trim().length > 0,
      body: (
        <Textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder="CS student in Nagpur. I build fast, simple websites for small businesses."
          className="min-h-28 text-base"
        />
      ),
    },
    {
      title: "Show your best work",
      hint: "Add 1 to 6 projects. Each company page shows the 2 or 3 that fit best.",
      ok: projects.some((p) => p.title.trim()),
      body: (
        <div className="flex flex-col gap-3">
          {projects.map((p, i) => (
            <div key={i} className="flex flex-col gap-2 rounded-[22px] bg-card p-3.5 shadow-card">
              <div className="flex gap-2">
                <Input value={p.title} onChange={(e) => update(i, { title: e.target.value })} placeholder="Project name" aria-label="Project name" />
                <select
                  value={p.skill_tag}
                  onChange={(e) => update(i, { skill_tag: e.target.value })}
                  aria-label="Skill"
                  className="h-12 rounded-2xl border bg-card px-3 text-[15px]"
                >
                  <option value="web">Web</option>
                  <option value="design">Design</option>
                </select>
              </div>
              <Input value={p.one_line} onChange={(e) => update(i, { one_line: e.target.value })} placeholder="What you made, and the result" aria-label="One line" />
              <Input value={p.link} onChange={(e) => update(i, { link: e.target.value })} placeholder="Link (optional)" type="url" aria-label="Link" />
              {projects.length > 1 && (
                <button
                  type="button"
                  onClick={() => setProjects(projects.filter((_, j) => j !== i))}
                  className="flex items-center gap-1 self-start text-xs text-muted-foreground"
                >
                  <Trash2 className="size-3.5" /> Remove
                </button>
              )}
            </div>
          ))}
          {projects.length < 6 && (
            <Button
              type="button"
              variant="secondary"
              className="self-start rounded-full"
              onClick={() => setProjects([...projects, { title: "", one_line: "", link: "", skill_tag: "web" }])}
            >
              <Plus /> Add another
            </Button>
          )}
        </div>
      ),
    },
    {
      title: "How do you write?",
      hint: "Paste 2 short messages you wrote yourself (WhatsApp, email, anything). Your pitch emails will sound like you.",
      ok: voices.filter((v) => v.trim()).length >= 1,
      body: (
        <div className="flex flex-col gap-3">
          {voices.map((v, i) => (
            <Textarea
              key={i}
              value={v}
              onChange={(e) => setVoices(voices.map((x, j) => (j === i ? e.target.value : x)))}
              placeholder={i === 0 ? "e.g. Hey, saw your message. I can take a look tonight." : "Another message"}
              className="min-h-24 text-base"
              aria-label={`Message ${i + 1}`}
            />
          ))}
        </div>
      ),
    },
  ];

  function update(i: number, patch: Partial<Project>) {
    setProjects(projects.map((p, j) => (j === i ? { ...p, ...patch } : p)));
  }

  const current = steps[step];
  const last = step === steps.length - 1;

  function next() {
    if (!current.ok) return;
    if (!last) {
      setDir("fwd");
      setStep(step + 1);
      return;
    }
    const form = new FormData();
    form.set("name", name);
    form.set("city", city);
    form.set("year_or_grad", year);
    form.set("goal", goal);
    form.set("bio", bio);
    if (student.photo_url) form.set("photo_url", student.photo_url);
    skills.forEach((s) => form.append("skill_types", s));
    voices.forEach((v) => form.append("voice_samples", v));
    projects.forEach((p) => {
      form.append("item_title", p.title);
      form.append("item_skill", p.skill_tag);
      form.append("item_line", p.one_line);
      form.append("item_link", p.link);
      form.append("item_image", "");
    });
    startSaving(async () => {
      const r = await saveProfile(null, form);
      if (r?.ok) router.push("/tour");
      else setError(r?.message ?? "Something went wrong.");
    });
  }

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col px-6 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))]">
      <div className="flex h-12 items-center gap-3">
        <button
          type="button"
          onClick={() => {
            setDir("back");
            setStep(Math.max(0, step - 1));
          }}
          aria-label="Back"
          className={cn("press -ml-2 flex size-10 items-center justify-center rounded-full bg-card shadow-card", step === 0 && "invisible")}
        >
          <ArrowLeft className="size-5" />
        </button>
        <div className="flex flex-1 gap-1.5">
          {steps.map((_, i) => (
            <div key={i} className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#e3e6f0]">
              <div className={cn("h-full origin-left rounded-full bg-primary transition-transform duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)]", i <= step ? "scale-x-100" : "scale-x-0")} />
            </div>
          ))}
        </div>
        <span className="w-10 text-right text-xs text-muted-foreground">
          {step + 1}/{steps.length}
        </span>
      </div>

      <form
        key={step}
        onSubmit={(e) => {
          e.preventDefault();
          next();
        }}
        className={cn("flex flex-1 flex-col", dir === "fwd" ? "pp-step-fwd" : "pp-step-back")}
      >
        <h1 className="mt-8 text-[26px] font-extrabold leading-tight tracking-tight">{current.title}</h1>
        <p className="mt-2 text-muted-foreground">{current.hint}</p>
        <div className="mt-6">{current.body}</div>
        {error && <p className="mt-4 text-sm text-destructive">{error}</p>}
        <div className="mt-auto pt-8">
          <Button type="submit" size="lg" disabled={!current.ok || saving} className="w-full">
            {last ? (saving ? "Saving…" : "Finish") : "Continue"}
          </Button>
        </div>
      </form>
    </div>
  );
}

function Choice({
  label,
  hint,
  icon: Icon,
  selected,
  onClick,
}: {
  label: string;
  hint: string;
  icon: React.ComponentType<{ className?: string }>;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        "press press-soft flex items-center gap-4 rounded-[22px] bg-card p-4 text-left shadow-card ring-2 ring-transparent",
        selected ? "ring-primary bg-[#f3f5ff]" : "hover:bg-accent",
      )}
    >
      <span className={cn("flex size-10 shrink-0 items-center justify-center rounded-full bg-muted transition-colors", selected && "bg-primary text-primary-foreground")}>
        <Icon className="size-5" />
      </span>
      <span className="flex-1">
        <span className="block font-medium">{label}</span>
        <span className="block text-sm text-muted-foreground">{hint}</span>
      </span>
      {selected && <Check className="size-5 text-primary" />}
    </button>
  );
}
