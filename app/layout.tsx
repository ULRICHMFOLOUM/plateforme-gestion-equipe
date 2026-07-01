import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import ChatButton from "@/components/ChatButton";
import PageTransition from "@/components/PageTransition";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "TeamFlow",
  description:
    "Plateforme complète de gestion d'équipe avec visioconférence, Kanban et gestion de fichiers",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body className={inter.className}>
        <Providers>
          {children}
          <ChatButton />
        </Providers>
      </body>
    </html>
  );
}
