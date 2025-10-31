import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { api } from "../lib/api";

interface Question {
  id: string;
  type: string;
  label: string;
  required?: boolean;
  options?: string[];
  showIf?: { questionId: string; equals: string };
  numericRange?: { min: number; max: number };
}

interface Section {
  id: string;
  title: string;
  questions: Question[];
}

interface AssessmentSchema {
  title: string;
  sections: Section[];
}

export default function AssessmentBuilderPage() {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const [schema, setSchema] = useState<AssessmentSchema>({
    title: "",
    sections: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<{ jobId: string; schema: AssessmentSchema } | AssessmentSchema>(
      `/assessments/${jobId}`
    )
      .then((res) => {
        if ("schema" in res) {
          setSchema(res.schema);
        } else {
          setSchema(res);
        }
      })
      .finally(() => setLoading(false));
  }, [jobId]);

  const addSection = () => {
    setSchema((prev) => ({
      ...prev,
      sections: [
        ...prev.sections,
        { id: `s${Date.now()}`, title: "New section", questions: [] }
      ]
    }));
  };

  const addQuestion = (sid: string, type = "short-text") => {
    setSchema((prev) => ({
      ...prev,
      sections: prev.sections.map((s) =>
        s.id === sid
          ? {
              ...s,
              questions: [
                ...s.questions,
                {
                  id: `q${Date.now()}`,
                  type,
                  label: "New question",
                  required: false
                }
              ]
            }
          : s
      )
    }));
  };

  const save = async () => {
    await api(`/assessments/${jobId}`, {
      method: "PUT",
      body: JSON.stringify({ jobId, schema })
    });
    alert("Saved");
  };

  if (loading) return <div className="p-4">Loading…</div>;

  return (
    <div className="p-4 flex gap-4">
      <div className="flex-1 space-y-3">
        <div className="flex justify-between items-center">
          <div>
            <Link to={`/jobs/${jobId}`} className="text-sm text-slate-500">
              ← Back to job
            </Link>
            <h1 className="text-xl font-semibold">Assessment for Job {jobId}</h1>
          </div>
          <div className="flex gap-2">
            <button
              onClick={save}
              className="bg-slate-900 text-white px-3 py-1 rounded text-sm"
            >
              Save
            </button>
            <button
              onClick={() => navigate(`/assessments/${jobId}/run`)}
              className="border px-3 py-1 rounded text-sm"
            >
              Preview / Run
            </button>
          </div>
        </div>
        <label className="block text-sm">
          Title
          <input
            className="border rounded w-full px-2 py-1 text-sm"
            value={schema.title}
            onChange={(e) => setSchema({ ...schema, title: e.target.value })}
          />
        </label>
        {schema.sections.map((s) => (
          <div key={s.id} className="border rounded p-3 bg-white space-y-2">
            <input
              className="text-sm font-semibold w-full"
              value={s.title}
              onChange={(e) =>
                setSchema((prev) => ({
                  ...prev,
                  sections: prev.sections.map((x) =>
                    x.id === s.id ? { ...x, title: e.target.value } : x
                  )
                }))
              }
            />
            <div className="space-y-2">
              {s.questions.map((q) => (
                <div key={q.id} className="border rounded p-2 space-y-1">
                  <div className="flex gap-2">
                    <select
                      className="text-xs border rounded px-1"
                      value={q.type}
                      onChange={(e) => {
                        const val = e.target.value;
                        setSchema((prev) => ({
                          ...prev,
                          sections: prev.sections.map((x) =>
                            x.id === s.id
                              ? {
                                  ...x,
                                  questions: x.questions.map((qq) =>
                                    qq.id === q.id ? { ...qq, type: val } : qq
                                  )
                                }
                              : x
                          )
                        }));
                      }}
                    >
                      <option value="short-text">Short text</option>
                      <option value="long-text">Long text</option>
                      <option value="single-choice">Single choice</option>
                      <option value="multi-choice">Multi choice</option>
                      <option value="numeric">Numeric (range)</option>
                      <option value="file">File upload (stub)</option>
                    </select>
                    <label className="text-xs flex gap-1 items-center">
                      <input
                        type="checkbox"
                        checked={q.required}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setSchema((prev) => ({
                            ...prev,
                            sections: prev.sections.map((x) =>
                              x.id === s.id
                                ? {
                                    ...x,
                                    questions: x.questions.map((qq) =>
                                      qq.id === q.id ? { ...qq, required: checked } : qq
                                    )
                                  }
                                : x
                            )
                          }));
                        }}
                      />
                      required
                    </label>
                  </div>
                  <input
                    className="border rounded w-full text-sm px-2 py-1"
                    value={q.label}
                    onChange={(e) => {
                      const val = e.target.value;
                      setSchema((prev) => ({
                        ...prev,
                        sections: prev.sections.map((x) =>
                          x.id === s.id
                            ? {
                                ...x,
                                questions: x.questions.map((qq) =>
                                  qq.id === q.id ? { ...qq, label: val } : qq
                                )
                              }
                            : x
                        )
                      }));
                    }}
                  />
                  {q.type === "single-choice" || q.type === "multi-choice" ? (
                    <textarea
                      className="border rounded w-full text-xs px-2 py-1"
                      placeholder="Options, one per line"
                      value={(q.options || []).join("\n")}
                      onChange={(e) => {
                        const opts = e.target.value.split("\n").map((x) => x.trim());
                        setSchema((prev) => ({
                          ...prev,
                          sections: prev.sections.map((x) =>
                            x.id === s.id
                              ? {
                                  ...x,
                                  questions: x.questions.map((qq) =>
                                    qq.id === q.id ? { ...qq, options: opts } : qq
                                  )
                                }
                              : x
                          )
                        }));
                      }}
                    />
                  ) : null}
                  {q.type === "numeric" ? (
                    <div className="flex gap-2 text-xs">
                      <input
                        type="number"
                        placeholder="min"
                        className="border rounded px-1"
                        value={q.numericRange?.min ?? ""}
                        onChange={(e) => {
                          const min = Number(e.target.value);
                          setSchema((prev) => ({
                            ...prev,
                            sections: prev.sections.map((x) =>
                              x.id === s.id
                                ? {
                                    ...x,
                                    questions: x.questions.map((qq) =>
                                      qq.id === q.id
                                        ? {
                                            ...qq,
                                            numericRange: { min, max: qq.numericRange?.max ?? 100 }
                                          }
                                        : qq
                                    )
                                  }
                                : x
                            )
                          }));
                        }}
                      />
                      <input
                        type="number"
                        placeholder="max"
                        className="border rounded px-1"
                        value={q.numericRange?.max ?? ""}
                        onChange={(e) => {
                          const max = Number(e.target.value);
                          setSchema((prev) => ({
                            ...prev,
                            sections: prev.sections.map((x) =>
                              x.id === s.id
                                ? {
                                    ...x,
                                    questions: x.questions.map((qq) =>
                                      qq.id === q.id
                                        ? {
                                            ...qq,
                                            numericRange: { min: qq.numericRange?.min ?? 0, max }
                                          }
                                        : qq
                                    )
                                  }
                                : x
                            )
                          }));
                        }}
                      />
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => addQuestion(s.id, "short-text")}
                className="text-xs border rounded px-2 py-1"
              >
                + Short text
              </button>
              <button
                onClick={() => addQuestion(s.id, "single-choice")}
                className="text-xs border rounded px-2 py-1"
              >
                + Single choice
              </button>
            </div>
          </div>
        ))}
        <button onClick={addSection} className="text-sm border rounded px-3 py-1">
          + Add section
        </button>
      </div>

      {/* live preview */}
      <div className="w-[360px] bg-white border rounded p-3 h-fit sticky top-4">
        <h2 className="text-sm font-semibold mb-2">Live preview</h2>
        <div className="text-base font-medium mb-2">{schema.title || "Untitled"}</div>
        {schema.sections.map((s) => (
          <div key={s.id} className="mb-3">
            <div className="text-xs uppercase text-slate-400 mb-1">{s.title}</div>
            {s.questions.map((q) => (
              <div key={q.id} className="mb-2 text-sm">
                <label className="block">
                  {q.label} {q.required && <span className="text-red-500">*</span>}
                </label>
                {q.type === "short-text" && (
                  <input className="border rounded w-full text-sm px-2 py-1" />
                )}
                {q.type === "long-text" && (
                  <textarea className="border rounded w-full text-sm px-2 py-1" />
                )}
                {(q.type === "single-choice" || q.type === "multi-choice") &&
                  (q.options || []).map((opt) => (
                    <label key={opt} className="flex gap-1 items-center text-xs">
                      <input type={q.type === "single-choice" ? "radio" : "checkbox"} />
                      {opt}
                    </label>
                  ))}
                {q.type === "numeric" && (
                  <input type="number" className="border rounded w-full text-sm px-2 py-1" />
                )}
                {q.type === "file" && <input type="file" disabled className="text-xs" />}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

