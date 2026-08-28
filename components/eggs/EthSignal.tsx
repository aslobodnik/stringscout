import Image from "next/image";
import type { EggProps } from "./Egg";
import eth from "./eth.webp";
import ethInk from "./eth-ink.webp";

// For Ethereum Name Service. The pig's signal with a different plate: the
// Ethereum diamond in its own facets, and nothing written under it. Same
// dusk, same spot, same size, same press and shadow; the styles are the
// Pig-Signal ones in globals.css.
export default function EthSignal({ out }: EggProps) {
  return (
    <div aria-hidden="true" className={`pig-signal${out ? " is-out" : ""}`}>
      <div className="pig-signal-dusk" />
      <div className="pig-signal-sign">
        <div className="pig-signal-stamp">
          <Image src={ethInk} alt="" unoptimized className="pig-signal-shadow" />
          <Image src={eth} alt="" unoptimized className="pig-signal-oink" />
        </div>
      </div>
    </div>
  );
}
