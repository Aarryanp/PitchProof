// The business types a student can pick in a search, and how each one maps
// to a Crustdata company search. The phone app shows the same labels
// (mobile/lib/data/models.dart, businessTypes) and saves the label in
// searches.sector, so the label is the key here.
//
// industries: values for the Crustdata filter basic_info.industries. LinkedIn
// renamed many industries, so both the old and the new name are listed.
// keyword: extra word to look for in the company name or description, for
// types that share a broad industry (dentists sit under "Medical Practices").
//
// TODO before the find step goes live: confirm each industry value with
// Crustdata's free autocomplete, so no credits are spent on empty searches.
// "Other" (free text typed by the student) has no mapping: the find step
// falls back to an Olostep web search for "<text> in <city>".

export type BusinessType = {
  label: string;
  group: "Tech and online" | "Local businesses";
  industries: string[];
  keyword?: string;
};

const health = ["Hospitals and Health Care", "Hospital & Health Care", "Medical Practices", "Medical Practice", "Mental Health Care"];
const software = ["Software Development", "Computer Software"];
const itServices = ["IT Services and IT Consulting", "Information Technology & Services", "Information Technology and Services"];
const fitness = ["Wellness and Fitness Services", "Health, Wellness & Fitness", "Health, Wellness and Fitness"];

export const businessTypes: BusinessType[] = [
  // Tech and online
  { label: "Tech startups", group: "Tech and online", industries: [...software, "Technology, Information and Internet", "Internet"] },
  { label: "IT services and software agencies", group: "Tech and online", industries: itServices },
  { label: "SaaS and software products", group: "Tech and online", industries: software, keyword: "SaaS" },
  { label: "E-commerce and D2C brands", group: "Tech and online", industries: ["Retail", "Online and Mail Order Retail", "Consumer Goods", "Retail Apparel and Fashion", "Personal Care Product Manufacturing"], keyword: "online" },
  { label: "Edtech", group: "Tech and online", industries: ["E-Learning Providers", "E-Learning", "Education Technology"] },
  { label: "Fintech", group: "Tech and online", industries: ["Financial Services"], keyword: "fintech" },
  { label: "Marketing and design agencies", group: "Tech and online", industries: ["Advertising Services", "Marketing and Advertising", "Design Services", "Graphic Design"] },
  // Local businesses
  { label: "Clinics and hospitals", group: "Local businesses", industries: health },
  { label: "Dental clinics", group: "Local businesses", industries: health, keyword: "dental" },
  { label: "Cafes and restaurants", group: "Local businesses", industries: ["Restaurants", "Food and Beverage Services", "Food & Beverages"] },
  { label: "Salons and spas", group: "Local businesses", industries: [...fitness, "Personal Care Services", "Cosmetics"], keyword: "salon" },
  { label: "Gyms and fitness", group: "Local businesses", industries: fitness },
  { label: "Coaching institutes", group: "Local businesses", industries: ["Education Administration Programs", "Education Management", "Professional Training and Coaching", "Professional Training & Coaching"] },
  { label: "Schools", group: "Local businesses", industries: ["Primary and Secondary Education", "Education Management"] },
  { label: "Real estate", group: "Local businesses", industries: ["Real Estate"] },
  { label: "CA and accounting firms", group: "Local businesses", industries: ["Accounting"] },
  { label: "Law firms", group: "Local businesses", industries: ["Law Practice", "Legal Services"] },
  { label: "Hotels", group: "Local businesses", industries: ["Hospitality", "Hotels and Motels"] },
  { label: "Travel agencies", group: "Local businesses", industries: ["Travel Arrangements", "Leisure, Travel & Tourism"] },
  { label: "Architects and interior designers", group: "Local businesses", industries: ["Architecture and Planning", "Interior Design"] },
  { label: "Event planners", group: "Local businesses", industries: ["Events Services"] },
  { label: "Retail shops", group: "Local businesses", industries: ["Retail"] },
];

export function businessTypeFor(label: string): BusinessType | undefined {
  return businessTypes.find((t) => t.label === label);
}
