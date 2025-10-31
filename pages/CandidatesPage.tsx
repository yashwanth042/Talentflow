import React, { useEffect, useState } from "react";
import { api } from "../lib/api";
import { Link } from "react-router-dom";

const STAGES = ["applied", "screen", "tech", "offer", "hired", "rejected"];

interface Candidate {
  id: string;
  name: string;
  email: string;
  stage: string;
  jobId?: string;
}

interface CandRes {
  data: Candidate[];
  total: number;
  page: number;
  pageSize: number;
}

export default function CandidatesPage() {
  const [search, setSearch] = useState("");
  const [stage, setStage] = useState("");
  const [cands, setCands] = useState<Candidate[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  async function load() {
    const q = `?page=${page}&search=${encodeURIComponent(search)}&stage=${stage}`;
    const res = await api<CandRes>(`/candidates${q}`);
    setCands(res.data);
    setTotal(res.total);
  }

  useEffect(() => {
    load().catch(console.error);
  }, [search, stage, page]);

  async function moveStage(id: string, to: string) {
    await api(`/candidates/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ stage: to })
    });
    load();
  }

  return (
    <div className="p-4">
      <div className="flex gap-2 mb-3">
        <input
          className="border rounded px-2 py-1 text-sm"
          placeholder="Search name/email"
          value={search}
          onChange={(e) => {
            setPage(1);
            setSearch(e.target.value);
          }}
        />
        <select
          className="border rounded px-2 py-1 text-sm"
          value={stage}
          onChange={(e) => {
            setPage(1);
            setStage(e.target.value);
          }}
        >
          <option value="">All stages</option>
          {STAGES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2">
          <ul className="bg-white border rounded divide-y max-h-[70vh] overflow-auto">
            {cands.map((c) => (
              <li key={c.id} className="p-3 flex justify-between gap-2 items-center">
                <div>
                  <Link to={`/candidates/${c.id}`} className="font-medium">
                    {c.name}
                  </Link>
                  <div className="text-xs text-slate-500">{c.email}</div>
                  <div className="text-[10px] mt-1 uppercase text-slate-400">
                    {c.stage}
                  </div>
                </div>
                <div className="flex gap-1 flex-wrap justify-end">
                  {STAGES.filter((s) => s !== c.stage).map((s) => (
                    <button
                      key={s}
                      onClick={() => moveStage(c.id, s)}
                      className="text-[10px] border rounded px-2 py-[2px]"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </li>
            ))}
          </ul>
          <div className="flex justify-center gap-2 mt-3">
            <button
              onClick={() => setPage((p) => p - 1)}
              disabled={page === 1}
              className="text-sm border rounded px-2 py-1 disabled:opacity-40"
            >
              Prev
            </button>
            <span className="text-sm">
              Page {page} / {Math.ceil(total / 50) || 1}
            </span>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={page * 50 >= total}
              className="text-sm border rounded px-2 py-1 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>

        {/* mini kanban view */}
        <div className="bg-white border rounded p-2">
          <h3 className="text-sm font-semibold mb-2">Kanban snapshot</h3>
          <div className="flex gap-2 overflow-auto">
            {STAGES.map((s) => (
              <div key={s} className="min-w-[120px]">
                <div className="text-xs font-semibold mb-1 capitalize">{s}</div>
                <div className="border rounded bg-slate-50 max-h-56 overflow-auto">
                  {cands
                    .filter((c) => c.stage === s)
                    .slice(0, 10)
                    .map((c) => (
                      <div key={c.id} className="p-1 text-[11px] border-b">
                        {c.name}
                      </div>
                    ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

