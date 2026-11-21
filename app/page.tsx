import { redirect } from "next/navigation";

// The proxy (proxy.ts) sends visitors to /welcome or /pipeline before this
// runs; this is only a fallback.
export default function Home() {
  redirect("/welcome");
}
