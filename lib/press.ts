import type { CSSProperties } from "react";

// Stagger for the press flourishes in globals.css, read there as a variable.
export type PressStyle = CSSProperties & { "--press-delay": string };
export const pressDelay = (ms: number): PressStyle => ({
  "--press-delay": `${ms}ms`,
});
