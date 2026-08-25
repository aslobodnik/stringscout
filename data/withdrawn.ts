// Withdrawals the applicant recorded itself after Applicant Auction's table
// last carried them. data/announced.ts is generated, so they live here and are
// laid over the scraped row for the same lead: `lead` is the name upstream
// prints and every string must sit on one of that lead's rows (tests/ asserts
// both). Once the scraper sees the same withdrawal upstream, the entry here is
// redundant and can go.
export type HandWithdrawal = {
  lead: string;
  strings: string[];
  url: string; // where the withdrawal is recorded
};

const UD_FILED =
  "https://unstoppabledomains.com/blog/categories/announcements/article/icann-applications-are-in";

export const handWithdrawn: HandWithdrawal[] = [
  // Unstoppable's filing post lists the partner TLDs not proceeding to ICANN.
  // .anime (Kintsugi Global), .agent (Sentient Foundation) and .blockchain
  // (Blockchain.com) sit on Unstoppable-led rows; .privacy, .brave and .twin
  // (Synergetics.ai) on rows led by the partner.
  { lead: "Unstoppable Domains", strings: ["anime", "agent", "blockchain"], url: UD_FILED },
  { lead: ".privacy team", strings: ["privacy"], url: UD_FILED },
  { lead: "Brave", strings: ["brave"], url: UD_FILED },
  { lead: ".twin project", strings: ["twin"], url: UD_FILED },
];
