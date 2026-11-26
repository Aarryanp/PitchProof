import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Clock, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { getFixPreview } from "@/lib/data";
import type { FixPage } from "@/lib/agent/fix";

export const metadata: Metadata = { title: "Your new home page (preview)" };

// Step 6, shown: the new version of the company's home page that the
// student made. Built from the company's own website text. Plain HTML and
// no images, so it opens fast on a phone. Unlisted and noindex (layout.tsx).
export default function PreviewPage({ params }: { params: Promise<{ slug: string }> }) {
  return (
    <Suspense fallback={<div className="flex-1" />}>
      <Preview params={params} />
    </Suspense>
  );
}

async function Preview({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = await getFixPreview(slug);
  if (!data) notFound();
  return <Site fix={data.fix} by={data.studentName} back={`/p/${slug}`} />;
}

function Site({ fix, by, back }: { fix: FixPage; by: string; back: string }) {
  const phone = fix.phones[0] ?? null;
  const tel = phone ? `tel:${phone.replace(/[^\d+]/g, "")}` : null;
  const wa = fix.whatsapp ? `https://wa.me/${fix.whatsapp}?text=${encodeURIComponent(`Hello ${fix.name}, I'd like to ask about an appointment.`)}` : null;

  return (
    <div className="pb-24">
      <p className="bg-neutral-900 px-4 py-2 text-center text-sm text-white">
        A preview made by {by}. Not live yet. <a href={back} className="underline underline-offset-4">Back to the note</a>
      </p>

      <header className="bg-teal-50 px-5 pb-10 pt-8">
        <div className="mx-auto max-w-xl">
          <h1 className="text-3xl font-bold leading-tight text-teal-950">{fix.name}</h1>
          {fix.tagline && <p className="mt-2 text-lg text-teal-900">{fix.tagline}</p>}
          {fix.highlights.length > 0 && (
            <ul className="mt-4 flex flex-wrap gap-2">
              {fix.highlights.map((h) => (
                <li key={h} className="rounded-full bg-white px-3 py-1 text-sm font-medium text-teal-900 shadow-sm">
                  {h}
                </li>
              ))}
            </ul>
          )}
          <div className="mt-6 flex gap-3">
            {tel && (
              <a href={tel} className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-teal-700 font-semibold text-white">
                <Phone className="size-5" /> Call
              </a>
            )}
            {wa && (
              <a href={wa} className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-green-600 font-semibold text-white">
                <MessageCircle className="size-5" /> WhatsApp
              </a>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-xl px-5">
        {fix.about && (
          <section className="mt-8">
            <h2 className="text-xl font-semibold">About us</h2>
            <p className="mt-2 text-neutral-700">{fix.about}</p>
          </section>
        )}

        {fix.services.length > 0 && (
          <section className="mt-8">
            <h2 className="text-xl font-semibold">What we do</h2>
            <ul className="mt-3 grid gap-2 sm:grid-cols-2">
              {fix.services.map((s) => (
                <li key={s} className="rounded-xl border border-neutral-200 px-4 py-3 text-neutral-800">
                  {s}
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="mt-8 rounded-2xl bg-neutral-50 p-5">
          <h2 className="text-xl font-semibold">Visit or contact us</h2>
          <ul className="mt-3 flex flex-col gap-3 text-neutral-800">
            {fix.address && (
              <li className="flex gap-3">
                <MapPin className="mt-1 size-5 shrink-0 text-teal-700" />
                <a href={`https://maps.google.com/?q=${encodeURIComponent(`${fix.name}, ${fix.address}`)}`} className="underline-offset-4 hover:underline">
                  {fix.address}
                </a>
              </li>
            )}
            {fix.hours && (
              <li className="flex gap-3">
                <Clock className="mt-1 size-5 shrink-0 text-teal-700" />
                {fix.hours}
              </li>
            )}
            {fix.phones.map((p) => (
              <li key={p} className="flex gap-3">
                <Phone className="mt-1 size-5 shrink-0 text-teal-700" />
                <a href={`tel:${p.replace(/[^\d+]/g, "")}`}>{p}</a>
              </li>
            ))}
            {fix.email && (
              <li className="flex gap-3">
                <Mail className="mt-1 size-5 shrink-0 text-teal-700" />
                <a href={`mailto:${fix.email}`} className="break-all">
                  {fix.email}
                </a>
              </li>
            )}
          </ul>
        </section>

        <p className="mt-10 text-center text-xs text-neutral-400">Made with the text from {fix.name}&apos;s current website.</p>
      </main>

      {(tel || wa) && (
        <nav className="fixed inset-x-0 bottom-0 flex gap-3 border-t border-neutral-200 bg-white/95 p-3 backdrop-blur sm:hidden">
          {tel && (
            <a href={tel} className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-teal-700 font-semibold text-white">
              <Phone className="size-5" /> Call
            </a>
          )}
          {wa && (
            <a href={wa} className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-green-600 font-semibold text-white">
              <MessageCircle className="size-5" /> WhatsApp
            </a>
          )}
        </nav>
      )}
    </div>
  );
}
