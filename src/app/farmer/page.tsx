"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getFarmerAccessToken } from "@/lib/api";

export default function FarmerHome() {
  const router = useRouter();

  useEffect(() => {
    router.replace(getFarmerAccessToken() ? "/farmer/overview" : "/farmer/login");
  }, [router]);

  return <p className="p-8 text-sm text-stone-600">Opening your farm account…</p>;
}
