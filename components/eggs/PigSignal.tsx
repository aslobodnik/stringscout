import Image from "next/image";
import type { EggProps } from "./Egg";
import oink from "./oink.png";
import oinkInk from "./oink-ink.png";

// For the applicant run by the CEO of Porkbun. Dusk falls and OINK is struck
// onto the page in Porkbun's pink: it presses on with a carbon-arc sputter,
// then drops a hard ink shadow: the same plate cut in ink, offset. Both
// plates carry a transparent ground; the dusk multiplies over the page so
// the ledger reads on through it.
// Styles in globals.css under "Pig-Signal".
export default function PigSignal({ out }: EggProps) {
  return (
    <div aria-hidden="true" className={`pig-signal${out ? " is-out" : ""}`}>
      <div className="pig-signal-dusk" />
      <div className="pig-signal-sign">
        <div className="pig-signal-stamp">
          <Image src={oinkInk} alt="" unoptimized className="pig-signal-shadow" />
          <Image src={oink} alt="" unoptimized className="pig-signal-oink" />
        </div>
      </div>
    </div>
  );
}
