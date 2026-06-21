import { useEffect, useState } from "react";
import { loadDataset, type Dataset } from "../data/load";

interface State {
  dataset: Dataset | null;
  error: string | null;
  loading: boolean;
}

export function useDataset(): State {
  const [state, setState] = useState<State>({
    dataset: null,
    error: null,
    loading: true,
  });

  useEffect(() => {
    let cancelled = false;
    loadDataset()
      .then((dataset) => {
        if (!cancelled) setState({ dataset, error: null, loading: false });
      })
      .catch((err: unknown) => {
        if (!cancelled)
          setState({
            dataset: null,
            error: err instanceof Error ? err.message : String(err),
            loading: false,
          });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
