"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface User {
  id: string;
  name: string | null;
  email: string;
}

export function useUser() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await fetch("/api/auth/get-session");
        if (!res.ok) {
          router.push("/login");
          return;
        }
        const data = await res.json();
        if (!data?.user) {
          router.push("/login");
          return;
        }
        setUser(data.user);
      } catch {
        router.push("/login");
      } finally {
        setLoading(false);
      }
    }
    fetchUser();
  }, [router]);

  return { user, loading };
}
