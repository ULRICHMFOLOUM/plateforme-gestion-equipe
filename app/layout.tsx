import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import ChatButton from "@/components/ChatButton";
import PageTransition from "@/components/PageTransition";
import ToastContainer from "@/components/ui/Toast";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "TeamFlows — Plateforme de Gestion d'Équipe",
  description:
    "Plateforme complète de gestion d'équipe avec visioconférence HD, Kanban, chat et gestion de fichiers",
  manifest: "/manifest.json",
  themeColor: "#4F46E5",
  icons: {
    icon: "/teamflow-logo.png",
    apple: "/teamflow-logo.png",
    shortcut: "/teamflow-logo.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "TeamFlows",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" type="image/png" href="/teamflow-logo.png" />
        <link rel="apple-touch-icon" href="/teamflow-logo.png" />
        <meta name="theme-color" content="#4F46E5" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
      </head>
      <body className={inter.className}>
        <Providers>
          {children}
          <ChatButton />
          <ToastContainer />
        </Providers>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').then(
                    function(reg) { console.log('PWA ServiceWorker registered with scope: ', reg.scope); },
                    function(err) { console.log('PWA ServiceWorker registration failed: ', err); }
                  );
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
