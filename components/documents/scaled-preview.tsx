"use client";

import { useEffect, useRef, useState } from "react";
import { A4_PX } from "@/lib/pdf/capture";

/** Fits the fixed-width A4 document into whatever width is available, keeping proportions. */
export function ScaledPreview({ children }: { children: React.ReactNode }) {
  const outer = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.5);
  const [height, setHeight] = useState(A4_PX.height);

  useEffect(() => {
    const measure = () => {
      if (outer.current) setScale(Math.min(1, outer.current.clientWidth / A4_PX.width));
      if (inner.current) setHeight(inner.current.offsetHeight);
    };
    const observer = new ResizeObserver(measure);
    if (outer.current) observer.observe(outer.current);
    if (inner.current) observer.observe(inner.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={outer} className="w-full overflow-hidden rounded-lg bg-white shadow-md ring-1 ring-foreground/10" style={{ height: height * scale }}>
      <div ref={inner} style={{ width: A4_PX.width, transform: `scale(${scale})`, transformOrigin: "top left" }}>
        {children}
      </div>
    </div>
  );
}
