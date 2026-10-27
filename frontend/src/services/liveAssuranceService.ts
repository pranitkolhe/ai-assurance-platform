import { useEffect, useState } from "react";
import { fetchAssuranceResultFromApi, getAssuranceResults } from "./assuranceService";
import { useLiveAssessments } from "./assessmentService";
import type { AssuranceResult } from "../models/assurance.model";

/**
 * Live assurance results, in sync with the backend.
 *
 * Root cause of empty Findings / Flagged Images / Evidence /
 * Risk pages (2026-10-27): those pages read only the localStorage
 * cache (assure_results), which nothing ever populated — the live
 * engine result was only shown on the Data Integrity page and
 * then discarded. This hook fetches GET /assurance-lab/{id}/results
 * (backend aggregates the live engine services) for every
 * non-draft assessment, caches each result via
 * fetchAssuranceResultFromApi (so the old stored pages also see
 * it), and returns the merged list. Assessments with no engine
 * result (service down, 503) are skipped, never faked.
 */
export function useLiveAssuranceResults(): {
  results: AssuranceResult[];
  loading: boolean;
} {
  const assessments = useLiveAssessments();
  const [results, setResults] = useState<AssuranceResult[]>(() => getAssuranceResults());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const ids = assessments
      .filter((a) => a.status !== "draft")
      .map((a) => a.id);
    if (ids.length === 0) {
      setResults(getAssuranceResults());
      setLoading(false);
      return;
    }
    setLoading(true);
    Promise.all(ids.map((id) => fetchAssuranceResultFromApi(id).catch(() => undefined)))
      .then(() => {
        if (!cancelled) setResults(getAssuranceResults());
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [assessments]);

  return { results, loading };
}
