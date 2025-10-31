import Dexie from "dexie";
import type { Table } from "dexie";

export interface Job {
  id: string;
  title: string;
  slug: string;
  status: "active" | "archived";
  tags: string[];
  order: number;
}

export interface Candidate {
  id: string;
  name: string;
  email: string;
  stage: "applied" | "screen" | "tech" | "offer" | "hired" | "rejected";
  jobId?: string;
}

export interface CandidateTimeline {
  id?: number;
  candidateId: string;
  ts: string;
  from?: string;
  to?: string;
  note?: string;
}

export interface Assessment {
  jobId: string;
  schema: any;
}

export interface AssessmentSubmission {
  id?: number;
  jobId: string;
  candidateId: string;
  payload: any;
  ts: string;
}

class TalentflowDB extends Dexie {
  jobs!: Table<Job, string>;
  candidates!: Table<Candidate, string>;
  timelines!: Table<CandidateTimeline, number>;
  assessments!: Table<Assessment, string>;
  submissions!: Table<AssessmentSubmission, number>;

  constructor() {
    super("talentflow-db");
    this.version(1).stores({
      jobs: "id, slug, status, order",
      candidates: "id, email, stage, jobId",
      timelines: "++id, candidateId",
      assessments: "jobId",
      submissions: "++id, jobId, candidateId"
    });
  }
}

export const db = new TalentflowDB();

