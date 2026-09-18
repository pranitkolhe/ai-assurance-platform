import { useMemo, useState } from "react";

import {
  Database,
  FileSearch,
  Layers3,
  Search,
  ShieldCheck,
} from "lucide-react";

import { loadReferences } from "../../../controllers/referenceController";

import type { ReferenceType } from "../../../models/reference.model";

type FilterType = "all" | ReferenceType;

export default function ReferenceRepositoryPage() {
  const references = loadReferences();

  const [filter, setFilter] = useState<FilterType>("all");

  const [search, setSearch] = useState("");

  const filteredReferences = useMemo(() => {
    const query = search.trim().toLowerCase();

    return references.filter((reference) => {
      const matchesType = filter === "all" || reference.type === filter;

      const matchesSearch =
        !query ||
        reference.name.toLowerCase().includes(query) ||
        reference.task.toLowerCase().includes(query) ||
        reference.format.toLowerCase().includes(query);

      return matchesType && matchesSearch;
    });
  }, [references, filter, search]);

  const counts = {
    dataset: references.filter((item) => item.type === "dataset").length,

    model: references.filter((item) => item.type === "model").length,

    inference: references.filter((item) => item.type === "inference").length,
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">
          Analyst Workspace
        </p>

        <h1 className="mt-1 text-2xl font-bold text-slate-900">
          Reference Repository
        </h1>

        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
          Browse approved reference assets used for dataset, model, and
          inference assurance. Analysts explicitly select references for
          individual assessment assets.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <RepositoryStat
          icon={Database}
          label="Dataset References"
          value={counts.dataset}
        />

        <RepositoryStat
          icon={Layers3}
          label="Model References"
          value={counts.model}
        />

        <RepositoryStat
          icon={FileSearch}
          label="Inference References"
          value={counts.inference}
        />
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full lg:max-w-md">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search references..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-blue-400 focus:bg-white"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <FilterButton
              active={filter === "all"}
              onClick={() => setFilter("all")}
            >
              All
            </FilterButton>

            <FilterButton
              active={filter === "dataset"}
              onClick={() => setFilter("dataset")}
            >
              Datasets
            </FilterButton>

            <FilterButton
              active={filter === "model"}
              onClick={() => setFilter("model")}
            >
              Models
            </FilterButton>

            <FilterButton
              active={filter === "inference"}
              onClick={() => setFilter("inference")}
            >
              Inference
            </FilterButton>
          </div>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        {filteredReferences.map((reference) => (
          <div
            key={reference.id}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex min-w-0 items-start gap-3">
                <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
                  <ShieldCheck size={20} />
                </div>

                <div className="min-w-0">
                  <h2 className="font-semibold text-slate-900">
                    {reference.name}
                  </h2>

                  <p className="mt-1 text-xs text-slate-500">
                    {reference.id} · {reference.format}
                  </p>
                </div>
              </div>

              <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold capitalize text-emerald-700">
                {reference.status}
              </span>
            </div>

            <p className="mt-4 text-sm leading-6 text-slate-600">
              {reference.description}
            </p>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <InfoItem label="Type" value={reference.type} />

              <InfoItem label="Task" value={reference.task} />

              <InfoItem label="Source" value={reference.source} />

              <InfoItem
                label="Version"
                value={String(reference.metadata.referenceVersion ?? "—")}
              />
            </div>

            <div className="mt-4 border-t border-slate-100 pt-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Compatibility Profile
              </p>

              <div className="mt-2 flex flex-wrap gap-2">
                {Object.entries(reference.compatibility)
                  .filter(([, value]) => Boolean(value))
                  .slice(0, 6)
                  .map(([key, value]) => (
                    <span
                      key={key}
                      className="rounded-lg bg-slate-50 px-2.5 py-1.5 text-xs text-slate-600"
                    >
                      {key}: {value}
                    </span>
                  ))}
              </div>
            </div>
          </div>
        ))}

        {filteredReferences.length === 0 && (
          <div className="xl:col-span-2 rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
            <p className="font-semibold text-slate-800">No references found</p>

            <p className="mt-1 text-sm text-slate-500">
              Try changing the search or reference type filter.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function RepositoryStat({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Database;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="rounded-xl bg-blue-50 p-2.5 text-blue-600">
          <Icon size={20} />
        </div>

        <div>
          <p className="text-xs font-medium text-slate-500">{label}</p>

          <p className="mt-1 text-2xl font-bold text-slate-900">{value}</p>
        </div>
      </div>
    </div>
  );
}

function FilterButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl px-3.5 py-2 text-sm font-medium transition ${
        active
          ? "bg-blue-600 text-white"
          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
      }`}
    >
      {children}
    </button>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-slate-50 p-3">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <p className="mt-1 truncate text-sm font-medium capitalize text-slate-700">
        {value}
      </p>
    </div>
  );
}
