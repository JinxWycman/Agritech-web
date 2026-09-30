import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to the Agritech AI staff console with the phone on your staff record.",
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
