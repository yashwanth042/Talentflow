import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../lib/api";

export default function AssessmentRunnerPage() {
  const { jobId } = useParams();
  const [schema, setSchema] = useState<any>(null);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [candidateId, setCandidateId] = useState("demo-candidate");

  useEffect(() => {
    api<any>(`/assessments/${jobId}`).then((res) => {
      setSchema("schema" in res ? res.schema : res);
    });
  }, [jobId]);

  const visible = (q: any) => {
    if (!q.showIf) return true;
    return answers[q.showIf.questionId] === q.showIf.equals;
  };

  const submit = async () => {
    // basic validation
    for (const s of schema.sections) {
      for (const q of s.questions) {
        if (q.required && visible(q) && !answers[q.id]) {
          alert(`Question "${q.label}" is required`);
          return;
        }
        if (q.type === "numeric" && visible(q) && answers[q.id] !== undefined) {
          const v = Number(answers[q.id]);
          if (q.numericRange) {
            if (v < q.numericRange.min || v > q.numericRange.max) {
              alert(`"${q.label}" must be between ${q.numericRange.min} and ${q.numericRange.max}`);
              return;
            }
          }
        }
      }
    }
    await api(`/assessments/${jobId}/submit`, {
      method: "POST",
      body: JSON.stringify({ candidateId, answers })
    });
    alert("Submitted locally");
  };

  if (!schema) return <div className="p-4">Loading…</div>;

  return (
    <div className="p-4 max-w-3xl mx-auto">
      <Link to={`/assessments/${jobId}`} className="text-sm text-slate-500">
        ← Back to builder
      </Link>
      <h1 className="text-2xl font-semibold mt-2">{schema.title}</h1>
      <label className="block mt-3 text-sm">
        Candidate Id
        <input
          value={candidateId}
          onChange={(e) => setCandidateId(e.target.value)}
          className="border rounded px-2 py-1 text-sm block"
        />
      </label>
      {schema.sections.map((s: any) => (
        <div key={s.id} className="mt-4">
          <div className="text-xs uppercase text-slate-400">{s.title}</div>
          {s.questions.map((q: any) =>
            visible(q) ? (
              <div key={q.id} className="mt-2 text-sm">
                <label className="block mb-1">
                  {q.label} {q.required && <span className="text-red-500">*</span>}
                </label>
                {q.type === "short-text" && (
                  <input
                    className="border rounded w-full px-2 py-1 text-sm"
                    value={answers[q.id] || ""}
                    onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                  />
                )}
                {q.type === "long-text" && (
                  <textarea
                    className="border rounded w-full px-2 py-1 text-sm"
                    value={answers[q.id] || ""}
                    onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                  />
                )}
                {q.type === "single-choice" &&
                  (q.options || []).map((opt: string) => (
                    <label key={opt} className="flex gap-1 items-center text-xs">
                      <input
                        type="radio"
                        checked={answers[q.id] === opt}
                        onChange={() => setAnswers({ ...answers, [q.id]: opt })}
                      />
                      {opt}
                    </label>
                  ))}
                {q.type === "multi-choice" &&
                  (q.options || []).map((opt: string) => (
                    <label key={opt} className="flex gap-1 items-center text-xs">
                      <input
                        type="checkbox"
                        checked={Array.isArray(answers[q.id]) && answers[q.id].includes(opt)}
                        onChange={(e) => {
                          const prev = Array.isArray(answers[q.id]) ? answers[q.id] : [];
                          const next = e.target.checked
                            ? [...prev, opt]
                            : prev.filter((x: string) => x !== opt);
                          setAnswers({ ...answers, [q.id]: next });
                        }}
                      />
                      {opt}
                    </label>
                  ))}
                {q.type === "numeric" && (
                  <input
                    type="number"
                    className="border rounded w-full px-2 py-1 text-sm"
                    value={answers[q.id] || ""}
                    onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                  />
                )}
                {q.type === "file" && (
                  <input
                    type="file"
                    onChange={() => {
                      // stub: just mark "uploaded"
                      setAnswers({ ...answers, [q.id]: "uploaded-file" });
                    }}
                  />
                )}
              </div>
            ) : null
          )}
        </div>
      ))}
      <button
        onClick={submit}
        className="mt-6 bg-slate-900 text-white px-4 py-2 rounded text-sm"
      >
        Submit
      </button>
    </div>
  );
}

