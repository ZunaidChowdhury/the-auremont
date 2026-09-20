import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "The Auremont",
  description: "The Auremont, New York City.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
