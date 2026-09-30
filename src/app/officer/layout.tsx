import type { Metadata } from "next";
import { Shell } from "@/components/shell";

export const metadata: Metadata = {
  title: "Field officer",
  description: "Agritech field desk.",
};

export default function OfficerLayout({ children }: { children: React.ReactNode }) {
  return <Shell>{children}</Shell>;
}
