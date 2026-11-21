"use client";

import { useActionState, useState } from "react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { startSearch, type SearchState } from "./actions";

const STEPS = [
  "Find businesses with a website",
  "Read and measure each website",
  "Keep only real, provable problems",
  "Find the right person to write to",
  "Draft an email for you to approve",
];

export function SearchForm() {
  const [state, action, pending] = useActionState<SearchState, FormData>(startSearch, null);
  const [count, setCount] = useState(10);

  return (
    <div className="grid max-w-4xl gap-6 md:grid-cols-[1fr_16rem]">
      <Card>
        <CardContent className="pt-5">
          <form action={action} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="skill_type">Skill</Label>
              <select id="skill_type" name="skill_type" className="h-9 rounded-md border bg-background px-2 text-sm">
                <option value="web">Web development</option>
                <option value="design">Design</option>
              </select>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="sector">Type of business</Label>
                <Input id="sector" name="sector" placeholder="Clinics" defaultValue="Clinics" />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="city">City</Label>
                <Input id="city" name="city" placeholder="Nagpur" defaultValue="Nagpur" />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="count">
                How many businesses <span className="font-normal text-muted-foreground">({count}, max 20)</span>
              </Label>
              <input
                id="count"
                name="count"
                type="range"
                min={1}
                max={20}
                value={count}
                onChange={(e) => setCount(Number(e.target.value))}
                className="accent-primary"
              />
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Button type="submit" disabled={pending}>
                <Search /> {pending ? "Starting…" : "Run the agent"}
              </Button>
              {state && <p className={cn("text-sm", state.ok ? "text-muted-foreground" : "text-destructive")}>{state.message}</p>}
            </div>
          </form>
        </CardContent>
      </Card>
      <div className="text-sm">
        <p className="mb-3 font-medium">What happens next</p>
        <ol className="flex flex-col gap-2.5">
          {STEPS.map((s, i) => (
            <li key={s} className="flex gap-2.5">
              <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium">{i + 1}</span>
              <span className="text-muted-foreground">{s}</span>
            </li>
          ))}
        </ol>
        <p className="mt-4 text-xs text-muted-foreground">Nothing is sent until you press Approve. At most 15 new emails a day.</p>
      </div>
    </div>
  );
}
