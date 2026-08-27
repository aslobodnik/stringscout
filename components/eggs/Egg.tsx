"use client";

import {
  useEffect,
  useRef,
  useState,
  type ComponentType,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import PigSignal from "./PigSignal";

// Names with something behind them. Hold the mouse on one for HOLD_MS and it
// shows; leave and it lingers LINGER_MS, then fades over FADE_MS. Coming back
// during either relights it. Mouse only: touch has no hover, and a phone has
// no room for it.
export type EggProps = { out: boolean };
const EGGS: Record<string, ComponentType<EggProps>> = {
  Oinkadot: PigSignal,
};
const HOLD_MS = 2000;
const LINGER_MS = 700;
export const FADE_MS = 500;

const mouse = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(hover: hover) and (pointer: fine)").matches;

type Phase = "off" | "lit" | "out";

export default function Egg({
  name,
  children,
}: {
  name: string;
  children: ReactNode;
}) {
  const Show = EGGS[name];
  const [phase, setPhase] = useState<Phase>("off");
  const timer = useRef<number | null>(null);
  const cancel = () => {
    if (timer.current !== null) window.clearTimeout(timer.current);
    timer.current = null;
  };
  useEffect(() => cancel, []);
  if (!Show) return <>{children}</>;
  return (
    <span
      onPointerEnter={(e) => {
        if (e.pointerType !== "mouse" || !mouse()) return;
        cancel();
        if (phase !== "off") setPhase("lit");
        else timer.current = window.setTimeout(() => setPhase("lit"), HOLD_MS);
      }}
      onPointerLeave={() => {
        cancel();
        if (phase !== "lit") return;
        timer.current = window.setTimeout(() => {
          setPhase("out");
          timer.current = window.setTimeout(() => setPhase("off"), FADE_MS);
        }, LINGER_MS);
      }}
    >
      {children}
      {phase !== "off" &&
        createPortal(<Show out={phase === "out"} />, document.body)}
    </span>
  );
}
