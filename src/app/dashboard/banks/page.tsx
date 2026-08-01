"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function BanksPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/dashboard/upload");
  }, [router]);
  return null;
}
