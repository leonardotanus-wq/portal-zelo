import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Zelo Portal — Notícias de Segurança e Acesso da Revenda",
  description:
    "Acompanhe notícias de segurança em tempo real e acesse o portal da revenda Zelo Equipamentos.",
  openGraph: {
    title: "Zelo Portal",
    description:
      "Notícias de segurança em tempo real e portal exclusivo das revendas Zelo Equipamentos.",
    type: "website",
    locale: "pt_BR",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-white">
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
