import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

// One font for the whole app: friendly, rounded and easy to read on phones.
const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Pitchproof",
  description: "Finds businesses that need a student's skills and drafts a pitch the student approves.",
  // On iPhone, "Add to Home Screen" opens the app full screen.
  appleWebApp: { capable: true, title: "Pitchproof", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  themeColor: "#f4f5fb",
  viewportFit: "cover",
};

const splashScript = `try{var d=document.documentElement;if(sessionStorage.getItem("pp-splash")){d.classList.add("pp-splash-seen")}else{sessionStorage.setItem("pp-splash","1");setTimeout(function(){d.classList.add("pp-splash-seen")},1500)}}catch(e){}`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${jakarta.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        {/* Show the splash only on the first screen of each visit. */}
        <script dangerouslySetInnerHTML={{ __html: splashScript }} />
      </head>
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
