import type { Metadata } from "next";

// Company pages are unlisted: search engines are told not to show them.
export const metadata: Metadata = {
  robots: { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } },
};

export default function CompanyPageLayout({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-1 flex-col bg-white text-[17px] leading-relaxed">{children}</div>;
}
