import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { getLocale, getMessages } from "next-intl/server";
import { NextIntlClientProvider } from "next-intl";
import { Providers } from "@/components/providers";
import { PwaRegister } from "@/components/pwa-register";
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
        <NextIntlClientProvider locale={locale} messages={messages}>
          <Providers>{children}</Providers>
<PwaRegister />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
