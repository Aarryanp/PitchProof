// Shapes of the data the screens show. They match the tables in supabase/schema.sql.

export type Goal = "internship" | "freelance" | "job";

export type Student = {
  id: string;
  name: string;
  bio: string | null;
  photo_url: string | null;
  year_or_grad: string | null;
  goal: Goal | null;
  skill_types: string[];
  city: string | null;
  voice_samples: string[];
  daily_limit: number;
};

export type PortfolioItem = {
  id: string;
  title: string;
  skill_tag: string | null;
  image_url: string | null;
  link: string | null;
  one_line: string | null;
};

// One problem the audit found. "hard" means the evidence is a number or a
// clear yes/no fact from a tool (the quality gate needs at least one).
export type Finding = {
  problem: string;
  evidence: string;
  source: string;
  hard: boolean;
};

export type PitchStatus =
  | "draft"
  | "approved"
  | "sent"
  | "opened"
  | "replied"
  | "declined"
  | "skipped";

// The seven columns of the pipeline board (docs/06-blueprint.md, screen 4).
export type Stage =
  | "found"
  | "audited"
  | "needs_approval"
  | "sent"
  | "opened"
  | "replied"
  | "skipped";

export type LeadCard = {
  key: string;
  companyName: string;
  sector: string | null;
  city: string | null;
  website: string | null;
  stage: Stage;
  pitchId: string | null;
  topProblem: string | null;
  skipReason: string | null;
};

export type PitchDetail = {
  id: string;
  status: PitchStatus;
  pitchType: "audit" | "generic";
  pageSlug: string | null;
  fixUrl: string | null;
  emailSubject: string;
  emailBody: string;
  personalLine: string;
  company: { name: string; website: string | null; sector: string | null; city: string | null };
  contact: { name: string | null; role: string | null; email: string | null; source: string | null } | null;
  findings: Finding[];
};

// What the public company page needs (screen 7).
export type CompanyPageData = {
  slug: string;
  student: { name: string; city: string | null; bio: string | null; photoUrl: string | null; email: string | null; phone: string | null };
  company: { name: string; city: string | null };
  findings: Finding[];
  before: { label: string; value: string };
  after: { label: string; value: string };
  projects: { title: string; oneLine: string | null; link: string | null; skillTag: string | null }[];
};
