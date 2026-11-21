import { redirect } from "next/navigation";

// The pipeline board is the home screen.
export default function Home() {
  redirect("/pipeline");
}
