import { Suspense } from "react";
import { decline } from "./actions";

export default function NotInterestedPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ done?: string }>;
}) {
  return (
    <main className="mx-auto w-full max-w-md px-5 py-16 text-center">
      <Suspense>
        <Body params={params} searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

async function Body({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ done?: string }> }) {
  const { slug } = await params;
  const { done } = await searchParams;
  if (done) {
    return (
      <>
        <h1 className="text-2xl font-semibold">Got it, thank you.</h1>
        <p className="mt-3 text-neutral-700">You won&apos;t hear from me again, and this page has been removed.</p>
      </>
    );
  }
  return (
    <>
      <h1 className="text-2xl font-semibold">Not interested?</h1>
      <p className="mt-3 text-neutral-700">No problem. Press the button and I won&apos;t write again.</p>
      <form action={decline.bind(null, slug)} className="mt-8">
        <button className="h-12 w-full rounded-lg border border-neutral-300 font-medium">Yes, please don&apos;t contact me</button>
      </form>
    </>
  );
}
