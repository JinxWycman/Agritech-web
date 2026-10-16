import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { getLocale, getMessages, getTranslations } from "next-intl/server";
import { NextIntlClientProvider } from "next-intl";
import { Providers } from "@/components/providers";
import { PwaRegister } from "@/components/pwa-register";
import { isProductionConfigured } from "@/lib/data-mode";
import "leaflet/dist/leaflet.css";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Agritech",
    template: "%s · Agritech",
  },
  description: "Agritech staff desk.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages();
  const t = await getTranslations("common");
  const configured = isProductionConfigured({
    nodeEnv: process.env.NODE_ENV,
    dataMode: process.env.NEXT_PUBLIC_DATA_MODE,
    demoEnabled: process.env.NEXT_PUBLIC_DEMO_ENABLED,
    apiBaseUrl: process.env.API_URL || process.env.NEXT_PUBLIC_API_BASE_URL,
  });
  return (
    <html lang={locale === "sw" ? "sw-KE" : "en-KE"} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html:
              'try{var t=localStorage.getItem("agritech_theme");var d=t==="dark"||(t!=="light"&&matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.dataset.theme=d?"dark":"light"}catch(e){}',
          }}
        />
      </head>
      <body className={`${geistSans.variable} font-sans antialiased`}>
        {configured ? (
          <NextIntlClientProvider locale={locale} messages={messages}>
            <Providers>
              {children}
              <PwaRegister />
            </Providers>
          </NextIntlClientProvider>
        ) : (
          <main className="mx-auto flex min-h-dvh max-w-2xl flex-col justify-center gap-3 p-6 text-[var(--foreground)]">
            <h1 className="text-3xl font-bold">{t("environmentNotConfiguredTitle")}</h1>
            <p className="text-[var(--muted)]">{t("environmentNotConfiguredText")}</p>
          </main>
        )}
      </body>
    </html>
  );
}
