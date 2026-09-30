import type { Metadata } from "next";
import { Shell } from "@/components/shell";

export const metadata: Metadata = {
  title: "Staff console",
  description: "Agritech staff desk.",
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <Shell>{children}</Shell>;
}
