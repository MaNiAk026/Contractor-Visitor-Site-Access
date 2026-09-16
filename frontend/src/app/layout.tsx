import type { Metadata } from "next";
import { Providers } from "@/app/providers";
import "@/app/globals.css";

export const metadata: Metadata = {
  title: "Renewi Access Operations",
  description: "Contractor and visitor site access and compliance operations."
};

/**
 * Root document layout for the Renewi access operations application.
 *
 * @param props - Children rendered by the active application route.
 * @returns The HTML shell with client-side providers.
 */
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
