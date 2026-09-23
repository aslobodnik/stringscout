// The shapes the table is handed from the server, taken from lib/derive. The
// imports are type-only, so none of the data reaches the client bundle.
import type { StringRow, stats } from "@/lib/derive";

// Passed in from the server rather than imported: this is the only client
// component, and importing @/data/sources drags the whole announced dataset
// and every claim into the browser bundle for 62 entries it actually reads.
export type Citation = { n: number; outlet: string; date: string };
export type Citations = Record<string, Citation>;

export type UiStringRow = StringRow;
export type UiStats = ReturnType<typeof stats>;
