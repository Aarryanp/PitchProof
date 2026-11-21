import type { Metadata } from "next";
import { Suspense } from "react";
import { getProfile } from "@/lib/data";
import { Loading } from "@/components/loading";
import { PageHeader } from "@/components/page-header";
import { SampleNote } from "@/components/sample-note";
import { ProfileForm } from "./profile-form";

export const metadata: Metadata = { title: "Profile · Pitchproof" };

// Screen 2: Profile. Who the student is, their past work, and how they write.
export default function ProfilePage() {
  return (
    <>
      <PageHeader
        title="Profile"
        description="Companies see your name, photo, one line about you and 2–3 of these projects."
      />
      <Suspense fallback={<Loading />}>
        <ProfileLoader />
      </Suspense>
    </>
  );
}

async function ProfileLoader() {
  const { student, portfolio, sample } = await getProfile();
  return (
    <>
      {sample && <SampleNote signedIn={false}>This is an example profile. Sign in to fill in your own.</SampleNote>}
      <ProfileForm student={student} portfolio={portfolio} readOnly={sample} />
    </>
  );
}
