import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://pollrr.com"),
  title: "Pollrr — Public opinion, in motion.",
  description:
    "One question. One tap. See what people really think—before the comments, the pile-ons, and the spin.",
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
  openGraph: {
    title: "Pollrr — Public opinion, in motion.",
    description: "One question. One tap. Real signal.",
    type: "website",
    images: [{ url: "/og.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Pollrr — Public opinion, in motion.",
    description: "One question. One tap. Real signal.",
    images: ["/og.png"],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
