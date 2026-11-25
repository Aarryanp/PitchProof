import type { Finding } from "@/lib/types";
import { abandoned, brokenSite, top3, type SkillPack } from "./types";

// Web development: speed, phones, HTTPS, ways to get in touch, upkeep.
export const webPack: SkillPack = {
  key: "web",
  name: "Web development",
  offer: "a faster, phone-friendly version of the site",
  findings(f) {
    const broken = brokenSite(f);
    if (broken.length) return broken;
    const out: Finding[] = [];
    if (f.performance !== null && f.performance < 50)
      out.push({
        problem: "Slow on phones",
        evidence: `Mobile speed score ${f.performance}/100${f.loadSeconds ? `; the main content takes about ${f.loadSeconds} seconds to show` : ""}`,
        source: "Google PageSpeed Insights (mobile)",
        hard: true,
      });
    if (f.hasViewport === false)
      out.push({ problem: "Breaks on phones", evidence: "Fails Google's mobile check: the page isn't set up for phone screens", source: "Google PageSpeed Insights (mobile)", hard: true });
    if (!f.https) out.push({ problem: "Not secure", evidence: "The site opens without HTTPS, so browsers mark it “Not secure”", source: "Website check", hard: true });
    if (f.pageRead && !f.hasPhone && !f.hasWhatsApp && !f.hasBooking)
      out.push({ problem: "Hard to contact", evidence: "No phone link, WhatsApp button or booking form on the home page", source: "Website read (Olostep)", hard: true });
    else if (f.pageRead && !f.hasWhatsApp)
      out.push({ problem: "No WhatsApp button", evidence: "The home page has no WhatsApp link for quick questions or bookings", source: "Website read (Olostep)", hard: true });
    out.push(...abandoned(f));
    return top3(out);
  },
};
