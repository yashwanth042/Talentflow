import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../lib/api";

interface Candidate {
  id: string;
  name: string;
  email: string;
  stage: string;
  jobId?: string;
}

interface TimelineItem {
  id?: number;
  candidateId: string;
  ts: string;
  from?: string;
  to?: string;
  note?: string;
}

export default function CandidateProfilePage() {
  const { id } = useParams();
  const [cand, setCand] = useState<Candidate | null>(null);
  const [timeline, setTimeline] = useState<TimelineItem[]>([]);
  const [note, setNote] = useState("");

  async function load() {
    // there's no GET /candidates/:id in spec, so fetch list + filter (quick hack)
    const res = await api<{ data: Candidate[] }>(`/candidates?search=${id}`);
    const found = res.data.find((c) => c.id === id) || null;
    setCand(found);
    const tl = await api<TimelineItem[]>(`/candidates/${id}/timeline`);
    setTimeline(tl.reverse());
  }

  useEffect(() => {
    load().catch(console.error);
  }, [id]);

  const addNote = async () => {
    // spec: "Attach notes with @mentions (just render; suggestions from local list)"
    // we'll just add to timeline as note
    setTimeline((prev) => [
      {
        candidateId: id!,
        ts: new Date().toISOString(),
        note
      },
      ...prev
    ]);
    setNote("");
  };

  if (!cand) return <div className="p-4">Loading…</div>;

  return (
    <div className="p-4 max-w-3xl mx-auto">
      <Link to="/candidates" className="text-sm text-slate-500">
        ← Back
      </Link>
      <h1 className="text-2xl font-semibold mt-2">{cand.name}</h1>
      <div className="text-sm text-slate-500">{cand.email}</div>
      <div className="text-xs mt-1 uppercase">{cand.stage}</div>
      <div className="mt-4 flex gap-2">
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Add note (@john, @hiring-manager)"
          className="border rounded px-2 py-1 text-sm flex-1"
        />
        <button onClick={addNote} className="bg-slate-900 text-white px-3 py-1 rounded text-sm">
          Add
        </button>
      </div>
      <h2 className="mt-4 mb-2 text-sm font-semibold">Timeline</h2>
      <ul className="bg-white border rounded divide-y">
        {timeline.map((t, i) => (
          <li key={i} className="p-2 text-sm">
            <div className="text-xs text-slate-400">
              {new Date(t.ts).toLocaleString()}
            </div>
            {t.note ? (
              <div>{t.note}</div>
            ) : (
              <div>
                Stage: {t.from || "—"} → <b>{t.to}</b>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

