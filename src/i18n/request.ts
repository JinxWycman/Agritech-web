import { getRequestConfig } from "next-intl/server";
import { cookies } from "next/headers";
import en from "@/i18n/messages/en";
import sw from "@/i18n/messages/sw";

export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const locale = cookieStore.get("agritech_locale")?.value === "sw" ? "sw" : "en";
  return { locale, messages: locale === "sw" ? sw : en };
});
