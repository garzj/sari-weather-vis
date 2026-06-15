import { useEffect, useRef, useState } from "react";

export interface Size {
  width: number;
  height: number;
}

// tracks an element's rendered size via ResizeObserver
export function useMeasure<T extends HTMLElement>(): [
  React.RefObject<T | null>,
  Size
] {
  const ref = useRef<T>(null);
  const [size, setSize] = useState<Size>({ width: 0, height: 0 });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      // round to whole pixels and skip no-op updates
      const width = Math.round(entry.contentRect.width);
      const height = Math.round(entry.contentRect.height);
      setSize((prev) =>
        prev.width === width && prev.height === height
          ? prev
          : { width, height }
      );
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return [ref, size];
}
