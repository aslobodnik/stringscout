export const MAX_QUERY_LENGTH = 120;
export const MAX_RESULTS = 25;

export type ExploreResult = {
  tld: string;
  gloss?: string;
  score: number;
};

export type ExploreResponse = {
  query: string;
  results: ExploreResult[];
  metrics: {
    serverMs: number;
    evaluated: number;
  };
};
