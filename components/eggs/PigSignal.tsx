import Image from "next/image";
import type { EggProps } from "./Egg";
import oink from "./oink.webp";
import oinkInk from "./oink-ink.webp";

// For the applicant run by the CEO of Porkbun. Dusk falls and a prize pig,
// cut from a hand-coloured engraving like the tailpiece, is struck onto the
// page: it presses on with a carbon-arc sputter, then drops a hard ink
// shadow, the same plate cut as a silhouette, offset. The plate's paper is
// baked to the page's own, so the pig lands as if printed on it; the dusk
// multiplies over the page so the ledger reads on through it.
// Styles in globals.css under "Pig-Signal".
export default function PigSignal({ out }: EggProps) {
  return (
    <div aria-hidden="true" className={`pig-signal${out ? " is-out" : ""}`}>
      <div className="pig-signal-dusk" />
      <div className="pig-signal-sign">
        <div className="pig-signal-stamp">
          <Image src={oinkInk} alt="" unoptimized className="pig-signal-shadow" />
          <Image src={oink} alt="" unoptimized className="pig-signal-oink" />
          <div className="pig-signal-oink pig-signal-caption">Oink.</div>
        </div>
      </div>
    </div>
  );
}
