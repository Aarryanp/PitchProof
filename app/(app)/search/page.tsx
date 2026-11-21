import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { SearchForm } from "./search-form";

export const metadata: Metadata = { title: "New search · Pitchproof" };

export default function SearchPage() {
  return (
    <>
      <PageHeader
        title="New search"
        description="Tell the agent what kind of business to look for. It checks each website and only keeps the ones with a real, measurable problem."
      />
      <SearchForm />
    </>
  );
}
