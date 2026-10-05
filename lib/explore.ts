export const MAX_QUERY_LENGTH = 120;
export const MAX_RESULTS = 25;

export type ExploreResult = {
  tld: string;
  gloss?: string;
  score: number;
  existing?: boolean;
  availability?: "coming-soon";
};

export type ExploreResponse = {
  query: string;
  results: ExploreResult[];
  resultSets?: { new?: ExploreResult[]; existing?: ExploreResult[] };
  complete?: boolean;
  metrics: {
    serverMs: number;
    evaluated: number;
  };
};
