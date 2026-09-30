"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getStaffRole } from "@/lib/api";
import { staffHome } from "@/lib/http";

export default function Home() {
  const router = useRouter();
  useEffect(() => {
    const destination = staffHome(getStaffRole());
    router.replace(destination ?? "/login");
  }, [router]);
  return <p className="p-8 text-sm text-stone-600">Opening…</p>;
}
