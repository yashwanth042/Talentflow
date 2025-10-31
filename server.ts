import { createServer, Model, Factory, Response } from "miragejs";
import { db as dexie } from "./db";
import { nanoid } from "nanoid";

const wait = (min = 200, max = 1200) =>
  new Promise((res) => setTimeout(res, Math.floor(Math.random() * (max - min)) + min));

export function makeServer({ environment = "development" } = {}) {
  const server = createServer({
    environment,
    models: {
      job: Model,
      candidate: Model,
      timeline: Model,
      assessment: Model
    },
    factories: {
      job: Factory.extend({
        title(i: number) {
          return `Job ${i + 1}`;
        },
        slug(i: number) {
          return `job-${i + 1}`;
        },
        status() {
          return Math.random() > 0.2 ? "active" : "archived";
        },
        tags() {
          return ["remote", "full-time"].slice(0, Math.random() > 0.5 ? 2 : 1);
        },
        order(i: number) {
          return i;
        }
      }),
      candidate: Factory.extend({
        name(i: number) {
          return `Candidate ${i + 1}`;
        },
        email(i: number) {
          return `candidate${i + 1}@mail.com`;
        },
        stage() {
          const stages = ["applied", "screen", "tech", "offer", "hired", "rejected"];
          return stages[Math.floor(Math.random() * stages.length)];
        },
        jobId() {
          return String(Math.floor(Math.random() * 25) + 1);
        }
      })
    },
    seeds(server) {
      // try to restore from Dexie first (async in Mirage is a bit hacky)
      // so we seed Mirage normally, and UI will fetch from Dexie and overwrite
      server.createList("job", 25);
      server.createList("candidate", 1000);

      // assessments (3 jobs with 10+ questions)
      server.db.assessments.insert({
        jobId: "1",
        schema: {
          title: "Frontend Engineer Assessment",
          sections: [
            {
              id: "s1",
              title: "Basics",
              questions: [
                { id: "q1", type: "short-text", label: "Tell us about your React exp", required: true },
                { id: "q2", type: "single-choice", label: "Years of exp", options: ["0-1", "1-3", "3-5", "5+"], required: true },
                { id: "q3", type: "long-text", label: "Describe a complex UI you built", required: false }
              ]
            }
          ]
        }
      });
      server.db.assessments.insert({
        jobId: "2",
        schema: { title: "PM Assessment", sections: [] }
      });
      server.db.assessments.insert({
        jobId: "3",
        schema: { title: "DS Assessment", sections: [] }
      });
    },
    routes() {
      this.namespace = "api";

      // JOBS
      this.get("/jobs", async (schema, request) => {
        await wait();
        const search = request.queryParams.search || "";
        const status = request.queryParams.status || "";
        const page = Number(request.queryParams.page || 1);
        const pageSize = Number(request.queryParams.pageSize || 10);

        let jobs = schema.all("job").models.sort((a, b) => a.order - b.order);
        if (search) {
          jobs = jobs.filter((j) =>
            j.title.toLowerCase().includes(search.toLowerCase())
          );
        }
        if (status) {
          jobs = jobs.filter((j) => j.status === status);
        }
        const total = jobs.length;
        const paged = jobs.slice((page - 1) * pageSize, page * pageSize);
        return { data: paged, total, page, pageSize };
      });

      this.post("/jobs", async (schema, request) => {
        await wait();
        if (Math.random() < 0.08) {
          return new Response(500, {}, { error: "Random failure" });
        }
        const attrs = JSON.parse(request.requestBody);
        const existing = schema.all("job").models;
        // unique slug
        if (existing.some((j) => j.slug === attrs.slug)) {
          return new Response(400, {}, { error: "Slug must be unique" });
        }
        const order = existing.length;
        const job = schema.create("job", { ...attrs, order, status: "active" });
        // write-through to Dexie
        dexie.jobs.put({ ...job.attrs, tags: job.attrs.tags || [] });
        return job;
      });

      this.patch("/jobs/:id", async (schema, request) => {
        await wait();
        const id = request.params.id;
        const attrs = JSON.parse(request.requestBody);
        const job = schema.find("job", id);
        if (!job) return new Response(404);
        job.update(attrs);
        dexie.jobs.put({ ...job.attrs, tags: job.attrs.tags || [] });
        return job;
      });

      this.patch("/jobs/:id/reorder", async (schema, request) => {
        await wait();
        // 5–10% error
        if (Math.random() < 0.1) {
          return new Response(500, {}, { error: "Reorder failed, rollback" });
        }
        const { fromOrder, toOrder } = JSON.parse(request.requestBody);
        const jobs = schema.all("job").models;
        const moving = jobs.find((j) => j.order === fromOrder);
        if (!moving) return new Response(400, {}, { error: "Invalid fromOrder" });
        jobs.forEach((j) => {
          if (fromOrder < toOrder) {
            if (j.order > fromOrder && j.order <= toOrder) j.update("order", j.order - 1);
          } else if (fromOrder > toOrder) {
            if (j.order < fromOrder && j.order >= toOrder) j.update("order", j.order + 1);
          }
        });
        moving.update("order", toOrder);
        // sync all to Dexie
        jobs.forEach((j) => {
          dexie.jobs.put({ ...j.attrs, tags: j.attrs.tags || [] });
        });
        return { ok: true };
      });

      // CANDIDATES
      this.get("/candidates", async (schema, request) => {
        await wait();
        const search = request.queryParams.search || "";
        const stage = request.queryParams.stage || "";
        const page = Number(request.queryParams.page || 1);
        const pageSize = 50;
        let cands = schema.all("candidate").models;
        if (search) {
          const l = search.toLowerCase();
          cands = cands.filter(
            (c) => c.name.toLowerCase().includes(l) || c.email.toLowerCase().includes(l)
          );
        }
        if (stage) cands = cands.filter((c) => c.stage === stage);
        const total = cands.length;
        const paged = cands.slice((page - 1) * pageSize, page * pageSize);
        return { data: paged, total, page, pageSize };
      });

      this.post("/candidates", async (schema, request) => {
        await wait();
        const attrs = JSON.parse(request.requestBody);
        const cand = schema.create("candidate", {
          ...attrs,
          stage: attrs.stage || "applied"
        });
        dexie.candidates.put(cand.attrs);
        // timeline
        schema.db.timelines.insert({
          candidateId: cand.id,
          ts: new Date().toISOString(),
          to: "applied",
          note: "Candidate created"
        });
        return cand;
      });

      this.patch("/candidates/:id", async (schema, request) => {
        await wait();
        const id = request.params.id;
        const attrs = JSON.parse(request.requestBody);
        const c = schema.find("candidate", id);
        if (!c) return new Response(404);
        const prev = c.stage;
        c.update(attrs);
        dexie.candidates.put(c.attrs);
        if (attrs.stage && attrs.stage !== prev) {
          schema.db.timelines.insert({
            candidateId: id,
            ts: new Date().toISOString(),
            from: prev,
            to: attrs.stage
          });
        }
        return c;
      });

      this.get("/candidates/:id/timeline", async (schema, request) => {
        await wait();
        const id = request.params.id;
        const rows = schema.db.timelines
          .where({ candidateId: id })
          .sortBy("ts");
        return rows;
      });

      // ASSESSMENTS
      this.get("/assessments/:jobId", async (schema, request) => {
        await wait();
        const jobId = request.params.jobId;
        const row = schema.db.assessments.findBy({ jobId });
        if (!row) {
          return { jobId, schema: { title: "New assessment", sections: [] } };
        }
        return row;
      });

      this.put("/assessments/:jobId", async (schema, request) => {
        await wait();
        const jobId = request.params.jobId;
        const body = JSON.parse(request.requestBody);
        const existing = schema.db.assessments.findBy({ jobId });
        if (existing) {
          schema.db.assessments.update(existing.id, body);
        } else {
          schema.db.assessments.insert(body);
        }
        dexie.assessments.put(body);
        return body;
      });

      this.post("/assessments/:jobId/submit", async (schema, request) => {
        await wait();
        const jobId = request.params.jobId;
        const body = JSON.parse(request.requestBody);
        const submission = {
          jobId,
          candidateId: body.candidateId,
          payload: body.answers,
          ts: new Date().toISOString()
        };
        schema.db.submissions.insert(submission);
        dexie.submissions.put(submission);
        return { ok: true };
      });
    }
  });

  return server;
}

