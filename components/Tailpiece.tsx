import Image from "next/image";
import plate from "./tailpiece.webp";

// A tailpiece in the printer's sense: the cut at the foot of a chapter. A
// clerk at a wall of screens, each showing a string, engraved the way a
// Victorian history plate was. It sits under the last rows, faint, and
// behind everything.
export default function Tailpiece() {
  return (
    <div aria-hidden className="tailpiece">
      <Image src={plate} alt="" unoptimized />
    </div>
  );
}
