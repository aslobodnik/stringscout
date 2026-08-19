// Strings announced before the application window opened, with no confirmed
// filing. Kept out of claims.ts on purpose: the applied-only rule governs the
// main table, and nothing here is an application.
export type Intent = {
  tld: string;
  announcer: string;
  partners: string | null;
  announcedOn: string;
  sourceIds: string[];
};

export const intents: Intent[] = [
  {
    tld: "anime",
    announcer: "Unstoppable Domains",
    partners: "Kintsugi Global",
    announcedOn: "2024-06",
    sourceIds: ["di"],
  },
  {
    tld: "manga",
    announcer: "Unstoppable Domains",
    partners: "Kintsugi Global",
    announcedOn: "2024-06",
    sourceIds: ["di"],
  },
  {
    tld: "anime",
    announcer: "D3",
    partners: "Animecoin Foundation, Azuki",
    announcedOn: "2025-02-27",
    sourceIds: ["di"],
  },
  {
    tld: "chain",
    announcer: "Freename.io",
    partners: null,
    announcedOn: "2025-02-27",
    sourceIds: ["di"],
  },
  {
    tld: "chain",
    announcer: "3DNS",
    partners: null,
    announcedOn: "2025-02-27",
    sourceIds: ["di"],
  },
];
