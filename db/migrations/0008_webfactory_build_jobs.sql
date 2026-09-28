BEGIN;
CREATE TABLE IF NOT EXISTS webfactory.website_build_jobs (
 id uuid PRIMARY KEY,
 request_id uuid NOT NULL REFERENCES webfactory.requests(id),
 customer_slug text NOT NULL,
 brief_id uuid NOT NULL REFERENCES webfactory.ai_briefs(id),
 approved_brief jsonb NOT NULL,
 instructions text NOT NULL,
 instruction_version text NOT NULL DEFAULT 'website-build-v1',
 submission_id uuid NOT NULL,
 status text NOT NULL CHECK(status IN ('queued','planning','generating','applying_changes','validating','building','qa_running','preview_deploying','preview_verifying','ready_for_review','changes_requested','failed','cancelled')),
 executor text NOT NULL,
 created_by text NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(),
 started_at timestamptz,
 finished_at timestamptz,
 error_category text,
 progress_code text NOT NULL DEFAULT 'authorized',
 changed_files jsonb NOT NULL DEFAULT '[]',
 qa_result jsonb NOT NULL DEFAULT '{}',
 preview_url text,
 deployment_reference text,
 requested_changes text NOT NULL DEFAULT '',
 UNIQUE(request_id, submission_id)
);
CREATE UNIQUE INDEX IF NOT EXISTS website_build_one_active_request ON webfactory.website_build_jobs(request_id)
 WHERE status IN ('queued','planning','generating','applying_changes','validating','building','qa_running','preview_deploying','preview_verifying');
CREATE UNIQUE INDEX IF NOT EXISTS website_build_one_active_slug ON webfactory.website_build_jobs(customer_slug)
 WHERE status IN ('queued','planning','generating','applying_changes','validating','building','qa_running','preview_deploying','preview_verifying');
CREATE INDEX IF NOT EXISTS website_build_request_history ON webfactory.website_build_jobs(request_id,created_at DESC);
CREATE TABLE IF NOT EXISTS webfactory.website_build_job_events (
 id bigserial PRIMARY KEY,
 job_id uuid NOT NULL REFERENCES webfactory.website_build_jobs(id),
 created_at timestamptz NOT NULL DEFAULT now(),
 status text NOT NULL,
 code text NOT NULL,
 actor text NOT NULL
);
CREATE INDEX IF NOT EXISTS website_build_event_history ON webfactory.website_build_job_events(job_id,id);
REVOKE ALL ON webfactory.website_build_jobs, webfactory.website_build_job_events FROM PUBLIC;
COMMIT;
