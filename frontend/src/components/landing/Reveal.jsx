import { useEffect, useRef, useState } from "react";

const OFFSET = {
  up: "translate-y-4",
  left: "-translate-x-4",
  right: "translate-x-4",
  none: "",
};

/**
 * Reveal — fades/slides its children into place the first time they scroll
 * into view, then stays put (no re-hide on scroll-up, so it never fights the
 * reader). Uses IntersectionObserver rather than a scroll listener — the
 * same pattern LandingNav already uses for its scroll-spy — so it costs
 * nothing on frames where nothing crosses the viewport, and disconnects
 * itself after firing once.
 *
 * `motion-reduce:` variants collapse straight to the visible end state, so
 * prefers-reduced-motion users never see the movement.
 */
export default function Reveal({
  children,
  as: Tag = "div",
  direction = "up",
  delay = 0,
  className = "",
}) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -8% 0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <Tag
      ref={ref}
      className={`transition-all duration-700 ease-out motion-reduce:transition-none motion-reduce:transform-none ${
        visible
          ? "translate-x-0 translate-y-0 scale-100 opacity-100"
          : `scale-[0.98] opacity-0 ${OFFSET[direction]}`
      } ${className}`}
      style={
        delay ? { transitionDelay: `${visible ? delay : 0}ms` } : undefined
      }
    >
      {children}
    </Tag>
  );
}
