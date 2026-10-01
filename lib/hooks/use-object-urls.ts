"use client";

import { useCallback, useEffect, useRef } from "react";

/**
 * Creates object URLs for previews/downloads and guarantees they're released: individually via
 * `revoke`, and all together when the component unmounts. Nothing lingers in memory after you leave.
 */
export function useObjectUrls() {
  const urls = useRef(new Set<string>());

  useEffect(() => {
    const set = urls.current;
    return () => {
      set.forEach((url) => URL.revokeObjectURL(url));
      set.clear();
    };
  }, []);

  const create = useCallback((blob: Blob) => {
    const url = URL.createObjectURL(blob);
    urls.current.add(url);
    return url;
  }, []);

  const revoke = useCallback((...list: (string | undefined | null)[]) => {
    for (const url of list) {
      if (!url) continue;
      URL.revokeObjectURL(url);
      urls.current.delete(url);
    }
  }, []);

  return { create, revoke };
}
