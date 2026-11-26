import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ArrowRight, Check, ExternalLink, Mail, MessageCircle } from "lucide-react";
import { getCompanyPage } from "@/lib/data";
import type { CompanyPageData } from "@/lib/types";

export const metadata: Metadata = { title: "A note about your website" };

// Screen 7: the company page. A short, personal letter from the student:
// who they are, the problem they found, the fix they made, and one button.
// No sign-in. Kept light so it loads fast on phones.
export default function CompanyPage({ params }: { params: Promise<{ slug: string }> }) {
  return (
    <Suspense fallback={<div className="flex-1" />}>
      <Letter params={params} />
    </Suspense>
  );
}

async function Letter({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = await getCompanyPage(slug);
  if (!page) notFound();
  return <LetterView page={page} />;
}

function LetterView({ page }: { page: CompanyPageData }) {
  const { student, company } = page;
  const first = student.name.split(" ")[0];
  const contactHref = student.phone
    ? `https://wa.me/${student.phone.replace(/\D/g, "")}?text=${encodeURIComponent(`Hi ${first}, this is about ${company.name}'s website.`)}`
    : student.email
      ? `mailto:${student.email}?subject=${encodeURIComponent(`${company.name} website`)}`
      : null;

  return (
    <main className="mx-auto w-full max-w-xl px-5 py-10 sm:py-14">
      {page.slug === "sample" && (
        <p className="mb-8 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-900">
          Sample page with a made-up business, to show what companies see.
        </p>
      )}

      <header className="flex items-center gap-4">
        {student.photoUrl ? (
          // Plain <img> keeps this page light; photos come from Supabase Storage.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={student.photoUrl} alt="" className="size-16 rounded-full object-cover" />
        ) : (
          <div className="flex size-16 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xl font-semibold text-primary">
            {first.charAt(0)}
          </div>
        )}
        <div>
          <p className="text-xl font-semibold">{student.name}</p>
          <p className="text-base text-neutral-600">{[student.bio, student.city && !student.bio?.includes(student.city) ? student.city : null].filter(Boolean).join(" · ")}</p>
        </div>
      </header>

      <section className="mt-10">
        <h1 className="text-2xl font-semibold leading-snug">
          Hi {company.name} team, I looked at your website.
        </h1>
        <p className="mt-3 text-neutral-700">Here&apos;s what I found when I checked it on a phone:</p>
        <ul className="mt-4 flex flex-col gap-3">
          {page.findings.map((f, i) => (
            <li key={i} className="rounded-lg border border-neutral-200 p-4">
              <p className="font-medium">{f.problem}</p>
              <p className="text-neutral-700">{f.evidence}</p>
              <p className="mt-1 text-sm text-neutral-500">Source: {f.source}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-semibold">What I made for you</h2>
        <p className="mt-2 text-neutral-700">A new version of your home page, using the text from your current site:</p>
        <ul className="mt-4 flex flex-col gap-2">
          {page.fixes.map((f) => (
            <li key={f} className="flex gap-2 text-neutral-800">
              <Check className="mt-1 size-5 shrink-0 text-green-600" />
              {f}
            </li>
          ))}
        </ul>
        {page.previewUrl && (
          <a
            href={page.previewUrl}
            className="mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg border-2 border-primary px-6 font-medium text-primary sm:w-auto"
          >
            See your new home page <ArrowRight className="size-5" />
          </a>
        )}
      </section>

      {page.projects.length > 0 && (
        <section className="mt-10">
          <h2 className="text-xl font-semibold">Things I&apos;ve built before</h2>
          <div className="mt-4 flex flex-col gap-3">
            {page.projects.slice(0, 3).map((p) => (
              <div key={p.title} className="rounded-lg border border-neutral-200 p-4">
                <p className="font-medium">{p.title}</p>
                {p.oneLine && <p className="text-neutral-700">{p.oneLine}</p>}
                {p.link && (
                  <a href={p.link} target="_blank" rel="noopener" className="mt-1 inline-flex items-center gap-1 text-base text-primary">
                    See it <ExternalLink className="size-4" />
                  </a>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="mt-12 flex flex-col items-center gap-4 text-center">
        <p className="text-neutral-700">If this is useful, I&apos;d be happy to finish it properly.</p>
        {contactHref && (
          <a
            href={contactHref}
            className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-primary px-6 font-medium text-primary-foreground sm:w-auto"
          >
            {student.phone ? <MessageCircle className="size-5" /> : <Mail className="size-5" />}
            {student.phone ? `WhatsApp ${first}` : `Reply to ${first}`}
          </a>
        )}
        <Link href={`/p/${page.slug}/no`} className="text-sm text-neutral-500 underline underline-offset-4">
          Not interested
        </Link>
      </section>

      <footer className="mt-16 text-center text-xs text-neutral-400">Sent with Pitchproof</footer>
    </main>
  );
}
