import type { Metadata } from "next";
import { Shell } from "@/components/shell";

export const metadata: Metadata = {
  title: "Field officer",
  description: "Agritech AI field desk for agriculture and veterinary officers.",
};

export default function OfficerLayout({ children }: { children: React.ReactNode }) {
  return <Shell>{children}</Shell>;
}
