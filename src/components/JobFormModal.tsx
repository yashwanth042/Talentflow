import React, { useState } from "react";
import { api } from "../lib/api";

export default function JobFormModal({
  onClose,
  onCreated
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [tags, setTags] = useState("");
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!title.trim()) {
      setError("Title is required");
      return;
    }
    try {
      await api("/jobs", {
        method: "POST",
        body: JSON.stringify({
          title,
          slug: slug || title.toLowerCase().replace(/\s+/g, "-"),
          tags: tags ? tags.split(",").map((t) => t.trim()) : []
        })
      });
      onCreated();
    } catch (e: any) {
      setError(e.message);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
      <form onSubmit={submit} className="bg-white rounded p-4 w-full max-w-sm space-y-3">
        <div className="flex justify-between items-center">
          <h2 className="font-semibold">Create Job</h2>
          <button type="button" onClick={onClose}>
            ✕
          </button>
        </div>
        <label className="text-sm space-y-1 block">
          <span>Title *</span>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="border rounded w-full px-2 py-1 text-sm"
          />
        </label>
        <label className="text-sm space-y-1 block">
          <span>Slug (unique)</span>
          <input
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            className="border rounded w-full px-2 py-1 text-sm"
          />
        </label>
        <label className="text-sm space-y-1 block">
          <span>Tags (comma separated)</span>
          <input
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            className="border rounded w-full px-2 py-1 text-sm"
          />
        </label>
        {error && <div className="text-red-600 text-xs">{error}</div>}
        <button className="w-full bg-slate-900 text-white rounded py-1 text-sm">
          Save
        </button>
      </form>
    </div>
  );
}

