import type { Finding } from "@/lib/types";
import { brokenSite, top3, type SkillPack } from "./types";

// AI chatbots: can a customer get a quick answer or book without calling?
export const chatbotPack: SkillPack = {
  key: "chatbot",
  name: "AI chatbots",
  offer: "a small chat assistant that answers common questions and takes bookings",
  findings(f) {
    const broken = brokenSite(f);
    if (broken.length) return broken;
    const out: Finding[] = [];
    if (f.pageRead && !f.hasChat && !f.hasWhatsApp && !f.hasBooking)
      out.push({ problem: "Slow enquiries", evidence: "No chat, WhatsApp or online booking on the home page, only calling or email", source: "Website read (Olostep)", hard: true });
    // Has a booking form or phone, just no chat: a nice-to-have, not a reason to pitch.
    else if (f.pageRead && !f.hasChat && !f.hasWhatsApp)
      out.push({ problem: "No quick way to ask a question", evidence: "No chat or WhatsApp on the home page", source: "Website read (Olostep)", hard: false });
    return top3(out);
  },
};
