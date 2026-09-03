import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

export const getRouter = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        // Offline-first: serve cached data immediately; pause refetches while
        // offline and retry with exponential backoff when connectivity returns.
        networkMode: "offlineFirst",
        retry: 3,
        retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 30_000),
        // Keep cached data around long enough to be useful offline.
        staleTime: 5 * 60 * 1000,
        gcTime: 24 * 60 * 60 * 1000,
      },
      mutations: {
        networkMode: "offlineFirst",
        retry: 3,
        retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 30_000),
      },
    },
  });

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
  });

  return router;
};
