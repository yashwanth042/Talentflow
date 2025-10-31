import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../lib/api";
import JobFormModal from "../components/JobFormModal";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

interface Job {
  id: string;
  title: string;
  slug: string;
  status: "active" | "archived";
  tags: string[];
  order: number;
}

interface JobsResponse {
  data: Job[];
  total: number;
  page: number;
  pageSize: number;
}

export default function JobsPage() {
  const { jobId } = useParams();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [total, setTotal] = useState(0);
  const [openModal, setOpenModal] = useState(false);
  const pageSize = 10;

  async function load() {
    const q = `?page=${page}&pageSize=${pageSize}&status=${status}&search=${encodeURIComponent(
      search
    )}`;
    const res = await api<JobsResponse>(`/jobs${q}`);
    setJobs(res.data);
    setTotal(res.total);
  }

  useEffect(() => {
    load().catch(console.error);
  }, [page, status, search]);

  const onDragEnd = async (result: any) => {
    if (!result.destination) return;
    const from = result.source.index;
    const to = result.destination.index;
    if (from === to) return;

    // optimistic
    const reordered = Array.from(jobs);
    const [moved] = reordered.splice(from, 1);
    reordered.splice(to, 0, moved);
    setJobs(reordered);

    try {
      await api(`/jobs/${moved.id}/reorder`, {
        method: "PATCH",
        body: JSON.stringify({ fromOrder: jobs[from].order, toOrder: jobs[to].order })
      });
      // refresh
      load();
    } catch (e) {
      // rollback
      setJobs(jobs);
      alert("Reorder failed — rolled back");
    }
  };

  return (
    <div className="p-4 max-w-5xl mx-auto">
      <div className="flex justify-between mb-3 gap-2">
        <div className="flex gap-2">
          <input
            className="border rounded px-2 py-1 text-sm"
            placeholder="Search title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            className="border rounded px-2 py-1 text-sm"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="">All</option>
            <option value="active">Active</option>
            <option value="archived">Archived</option>
          </select>
        </div>
        <button
          onClick={() => setOpenModal(true)}
          className="bg-slate-900 text-white px-3 py-1 rounded text-sm"
        >
          + New Job
        </button>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="jobs">
          {(provided) => (
            <ul ref={provided.innerRef} {...provided.droppableProps} className="space-y-2">
              {jobs.map((job, i) => (
                <Draggable key={job.id} draggableId={job.id} index={i}>
                  {(prov) => (
                    <li
                      ref={prov.innerRef}
                      {...prov.draggableProps}
                      {...prov.dragHandleProps}
                      className="bg-white border rounded p-3 flex justify-between items-center"
                    >
                      <div>
                        <div className="font-medium">{job.title}</div>
                        <div className="text-xs text-slate-500">{job.slug}</div>
                        <div className="flex gap-1 mt-1">
                          {job.tags?.map((t) => (
                            <span
                              key={t}
                              className="bg-slate-100 text-slate-600 text-[10px] px-2 py-[1px] rounded"
                            >
                              {t}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="text-xs">{job.status}</div>
                    </li>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </ul>
          )}
        </Droppable>
      </DragDropContext>

      <div className="flex justify-center gap-2 mt-4">
        <button
          className="text-sm px-2 py-1 border rounded disabled:opacity-40"
          disabled={page === 1}
          onClick={() => setPage((p) => p - 1)}
        >
          Prev
        </button>
        <div className="text-sm">
          Page {page} / {Math.ceil(total / pageSize) || 1}
        </div>
        <button
          className="text-sm px-2 py-1 border rounded disabled:opacity-40"
          disabled={page * pageSize >= total}
          onClick={() => setPage((p) => p + 1)}
        >
          Next
        </button>
      </div>

      {openModal && (
        <JobFormModal
          onClose={() => setOpenModal(false)}
          onCreated={() => {
            setOpenModal(false);
            load();
          }}
        />
      )}
    </div>
  );
}

