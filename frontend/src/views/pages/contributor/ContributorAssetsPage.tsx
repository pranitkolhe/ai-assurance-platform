import { useMemo, useState } from "react";
import { Database, FileCheck2, Search, ShieldAlert } from "lucide-react";

import { useAuth } from "../../../context/AuthContext";
import { loadAssessments } from "../../../controllers/assessmentController";
import { getAllAssets } from "../../../services/assessmentService";

export default function ContributorAssetsPage() {
  const { user } = useAuth();

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const assessments = loadAssessments();
  const allAssets = getAllAssets();

  const myAssessmentIds = useMemo(() => {
    if (!user) return new Set<string>();

    return new Set(
      assessments
        .filter((assessment) => assessment.contributorId === user.id)
        .map((assessment) => assessment.id),
    );
  }, [assessments, user]);

  const myAssets = useMemo(
    () => allAssets.filter((asset) => myAssessmentIds.has(asset.assessmentId)),
    [allAssets, myAssessmentIds],
  );

  const filteredAssets = useMemo(() => {
    const query = search.trim().toLowerCase();

    return myAssets.filter((asset) => {
      const matchesSearch =
        !query ||
        asset.id.toLowerCase().includes(query) ||
        asset.name.toLowerCase().includes(query) ||
        asset.format.toLowerCase().includes(query) ||
        asset.assessmentId.toLowerCase().includes(query);

      const matchesType = typeFilter === "all" || asset.type === typeFilter;

      const matchesStatus =
        statusFilter === "all" || asset.status === statusFilter;

      return matchesSearch && matchesType && matchesStatus;
    });
  }, [myAssets, search, typeFilter, statusFilter]);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium text-blue-600">
          Contributor Workspace
        </p>

        <h1 className="mt-1 text-2xl font-semibold text-slate-900">
          My Assets
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          View datasets, models, and inference records submitted by you.
        </p>
      </div>

      {/* Summary */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          label="Total Assets"
          value={myAssets.length}
          icon={Database}
        />

        <SummaryCard
          label="Datasets"
          value={myAssets.filter((a) => a.type === "dataset").length}
          icon={Database}
        />

        <SummaryCard
          label="Models"
          value={myAssets.filter((a) => a.type === "model").length}
          icon={FileCheck2}
        />

        <SummaryCard
          label="Flagged"
          value={myAssets.filter((a) => a.status === "flagged").length}
          icon={ShieldAlert}
        />
      </div>

      {/* Filters */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid gap-3 lg:grid-cols-[1fr_180px_180px]">
          <div className="relative">
            <Search
              size={17}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search assets..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-blue-400 focus:bg-white"
            />
          </div>

          <select
            value={typeFilter}
            onChange={(event) => setTypeFilter(event.target.value)}
            className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-700 outline-none"
          >
            <option value="all">All Asset Types</option>
            <option value="dataset">Dataset</option>
            <option value="model">Model</option>
            <option value="inference">Inference</option>
          </select>

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-700 outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="submitted">Submitted</option>
            <option value="verified">Verified</option>
            <option value="flagged">Flagged</option>
          </select>
        </div>
      </div>

      {/* Asset table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-4">
          <h2 className="font-semibold text-slate-900">Uploaded Assets</h2>

          <p className="mt-1 text-xs text-slate-500">
            {filteredAssets.length} asset
            {filteredAssets.length === 1 ? "" : "s"} shown
          </p>
        </div>

        {filteredAssets.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <Database size={32} className="mx-auto text-slate-300" />

            <p className="mt-3 font-medium text-slate-700">No assets found</p>

            <p className="mt-1 text-sm text-slate-500">
              Upload assets through the Submit Assets page.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredAssets.map((asset) => {
              const assessment = assessments.find(
                (item) => item.id === asset.assessmentId,
              );

              return (
                <div
                  key={asset.id}
                  className="flex flex-col gap-4 px-5 py-4 lg:flex-row lg:items-center lg:justify-between"
                >
                  <div className="flex min-w-0 items-start gap-3">
                    <div className="rounded-xl bg-slate-100 p-2.5 text-slate-600">
                      <Database size={18} />
                    </div>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate font-medium text-slate-900">
                          {asset.name}
                        </p>

                        <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500">
                          {asset.id}
                        </span>
                      </div>

                      <p className="mt-1 text-xs text-slate-500">
                        {assessment?.name ?? asset.assessmentId}
                      </p>

                      <div className="mt-2 flex flex-wrap gap-2">
                        <TypeBadge type={asset.type} />

                        <span className="rounded-full bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600">
                          {asset.format}
                        </span>

                        <span className="rounded-full bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600">
                          {asset.size}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <AssetStatus status={asset.status} />

                    <span className="text-xs text-slate-400">
                      {formatDate(asset.uploadedAt)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number;
  icon: typeof Database;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-500">{label}</p>

          <p className="mt-2 text-2xl font-semibold text-slate-900">{value}</p>
        </div>

        <div className="rounded-xl bg-slate-100 p-2.5 text-slate-600">
          <Icon size={19} />
        </div>
      </div>
    </div>
  );
}

function TypeBadge({ type }: { type: "dataset" | "model" | "inference" }) {
  return (
    <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold capitalize text-blue-700">
      {type}
    </span>
  );
}

function AssetStatus({
  status,
}: {
  status: "submitted" | "verified" | "flagged";
}) {
  const classes = {
    submitted: "bg-slate-100 text-slate-600",
    verified: "bg-emerald-50 text-emerald-700",
    flagged: "bg-red-50 text-red-700",
  };

  return (
    <span
      className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${classes[status]}`}
    >
      {status}
    </span>
  );
}

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString();
}
