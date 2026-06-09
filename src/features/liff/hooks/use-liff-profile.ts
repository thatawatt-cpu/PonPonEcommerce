"use client";

import { useEffect, useState } from "react";
import { getLiffProfile, initLiff } from "@/lib/liff";
import type { LiffProfile } from "@/types/liff";

interface UseLiffProfileResult {
  profile: LiffProfile | null;
  loading: boolean;
  error: string | null;
}

/**
 * Loads the (mock) LINE profile on mount. Mirrors the shape of a real LIFF
 * hook so swapping in the real SDK later is a one-file change.
 */
export function useLiffProfile(): UseLiffProfileResult {
  const [profile, setProfile] = useState<LiffProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        await initLiff();
        const result = await getLiffProfile();
        if (!cancelled) setProfile(result);
      } catch {
        if (!cancelled) setError("ไม่สามารถโหลดโปรไฟล์ LINE ได้");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return { profile, loading, error };
}
