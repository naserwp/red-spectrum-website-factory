BEGIN;
ALTER TABLE webfactory.requests ADD COLUMN IF NOT EXISTS customer_slug text CHECK(customer_slug IS NULL OR (length(customer_slug) BETWEEN 2 AND 80 AND customer_slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'));
ALTER TABLE webfactory.requests ADD COLUMN IF NOT EXISTS slug_confirmed_at timestamptz;
CREATE UNIQUE INDEX IF NOT EXISTS webfactory_request_slug_unique ON webfactory.requests(customer_slug) WHERE customer_slug IS NOT NULL;
CREATE TABLE IF NOT EXISTS webfactory.request_actions (
  id bigserial PRIMARY KEY,
  request_id uuid NOT NULL REFERENCES webfactory.requests(id),
  actor text NOT NULL DEFAULT 'server (unattributed)',
  action text NOT NULL,
  status_before text,
  status_after text,
  customer_slug text,
  preview_url text,
  notes text NOT NULL DEFAULT '',
  event_key text UNIQUE,
  created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS request_actions_history ON webfactory.request_actions(request_id,created_at DESC,id DESC);
INSERT INTO webfactory.request_actions(request_id,actor,action,status_after,event_key,created_at,notes)
SELECT id,'legacy (unattributed)','request_created','received','request:'||id,created_at,'Historical creation timestamp; original actor was not recorded.' FROM webfactory.requests
ON CONFLICT(event_key) DO NOTHING;
INSERT INTO webfactory.request_actions(request_id,actor,action,event_key,created_at,notes)
SELECT request_id,'legacy (unattributed)',event,'build-event:'||id,created_at,'Imported existing build event; status snapshots and actor were not recorded.' FROM webfactory.build_events
WHERE NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='audit_factory_workflow' AND tgrelid='webfactory.build_workflows'::regclass)
ON CONFLICT(event_key) DO NOTHING;
CREATE OR REPLACE FUNCTION webfactory.audit_request_workflow() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE rid uuid; event_name text; before_status text; after_status text; slug text; preview text; actor_name text; event_notes text := ''; dedup_key text;
BEGIN
  actor_name=COALESCE(NULLIF(current_setting('webfactory.actor',true),''),'server (unattributed)');
  IF TG_TABLE_NAME='requests' THEN
    rid=NEW.id; slug=NEW.customer_slug;
    IF TG_OP='INSERT' THEN event_name='request_created';after_status=NEW.status;dedup_key='request:'||NEW.id;
    ELSIF NEW.customer_slug IS DISTINCT FROM OLD.customer_slug OR NEW.slug_confirmed_at IS DISTINCT FROM OLD.slug_confirmed_at THEN event_name='slug_updated';before_status=OLD.status;after_status=NEW.status;
    ELSE RETURN NEW; END IF;
  ELSIF TG_TABLE_NAME='build_workflows' THEN
    rid=NEW.request_id;preview=NEW.preview_url;
    IF TG_OP='INSERT' THEN RETURN NEW; END IF;
    before_status=OLD.stage;after_status=NEW.stage;
    IF NEW.preview_url IS DISTINCT FROM OLD.preview_url AND NEW.stage IS DISTINCT FROM OLD.stage THEN
      INSERT INTO webfactory.request_actions(request_id,actor,action,status_before,status_after,customer_slug,preview_url) SELECT rid,actor_name,'preview_url_saved',OLD.stage,NEW.stage,customer_slug,NEW.preview_url FROM webfactory.requests WHERE id=rid;
    END IF;
    IF NEW.stage IS DISTINCT FROM OLD.stage THEN event_name=CASE NEW.stage WHEN 'build_approved' THEN 'build_approved' WHEN 'preview_ready' THEN 'preview_ready_marked' WHEN 'customer_approved' THEN 'customer_approved' ELSE 'build_approval_reset' END;
      IF OLD.stage IN ('preview_ready','customer_approved') AND NEW.stage='build_approved' THEN event_name='review_reopened'; END IF;
    ELSIF NEW.preview_url IS DISTINCT FROM OLD.preview_url THEN event_name='preview_url_saved';
    ELSE RETURN NEW; END IF;
  ELSIF TG_TABLE_NAME='ai_briefs' THEN
    rid=NEW.request_id;
    IF NEW.status<>'generated' OR (TG_OP='UPDATE' AND OLD.status='generated') THEN RETURN NEW; END IF;
    event_name=CASE WHEN EXISTS(SELECT 1 FROM webfactory.ai_briefs WHERE request_id=rid AND id<>NEW.id AND status='generated') THEN 'ai_brief_regenerated' ELSE 'ai_brief_generated' END;
    before_status='generating';after_status='generated';
    INSERT INTO webfactory.request_actions(request_id,actor,action,customer_slug,notes) VALUES(rid,actor_name,'slug_suggested',NEW.brief->>'customerSlug','AI suggestion only; not confirmed.');
  ELSE
    rid=NEW.request_id;preview=NEW.preview_url;after_status=NEW.review_status;
    event_notes=left(concat_ws(E'\n',NULLIF(NEW.notes,''),NULLIF(NEW.requested_changes,'')),1500);
    SELECT review_status INTO before_status FROM webfactory.request_review_events WHERE request_id=rid AND id<>NEW.id AND kind='review' ORDER BY created_at DESC LIMIT 1;
    event_name=CASE WHEN NEW.kind='rebuild_prompt' THEN 'rebuild_prompt_saved' WHEN NEW.kind<>'review' THEN NEW.kind||'_saved' WHEN NEW.review_status='changes_requested' THEN 'changes_requested' WHEN NEW.preview_url<>'' THEN 'preview_url_saved' ELSE 'review_saved' END;
  END IF;
  SELECT customer_slug INTO slug FROM webfactory.requests WHERE id=rid;
  INSERT INTO webfactory.request_actions(request_id,actor,action,status_before,status_after,customer_slug,preview_url,notes,event_key)
  VALUES(rid,actor_name,event_name,before_status,after_status,slug,COALESCE(preview,CASE WHEN slug IS NOT NULL THEN 'https://preview.redspectrum.ai/'||slug END),event_notes,dedup_key) ON CONFLICT(event_key) DO NOTHING;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS audit_factory_request ON webfactory.requests;
CREATE TRIGGER audit_factory_request AFTER INSERT OR UPDATE ON webfactory.requests FOR EACH ROW EXECUTE FUNCTION webfactory.audit_request_workflow();
DROP TRIGGER IF EXISTS audit_factory_workflow ON webfactory.build_workflows;
CREATE TRIGGER audit_factory_workflow AFTER INSERT OR UPDATE ON webfactory.build_workflows FOR EACH ROW EXECUTE FUNCTION webfactory.audit_request_workflow();
DROP TRIGGER IF EXISTS audit_factory_brief ON webfactory.ai_briefs;
CREATE TRIGGER audit_factory_brief AFTER INSERT OR UPDATE ON webfactory.ai_briefs FOR EACH ROW EXECUTE FUNCTION webfactory.audit_request_workflow();
DROP TRIGGER IF EXISTS audit_factory_review ON webfactory.request_review_events;
CREATE TRIGGER audit_factory_review AFTER INSERT ON webfactory.request_review_events FOR EACH ROW EXECUTE FUNCTION webfactory.audit_request_workflow();
COMMIT;
