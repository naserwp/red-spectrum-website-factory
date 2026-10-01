import Link from 'next/link';
import type { ProjectStatus } from '@/lib/webfactory/project-status';

export function ProjectStatusCard({ project, detail = false }: { project: ProjectStatus; detail?: boolean }) {
  return <article className="v2-card"><div className="v2-section-head"><div><span className="v2-badge">{project.stageLabel}</span><h2 style={{ margin: '15px 0' }}>{project.title}</h2></div><span className="v2-muted">Updated {project.updatedAt.slice(0, 10)}</span></div>
    <p className="v2-muted">{project.nextAction}</p>
    <ol className="v2-project-timeline" aria-label="Project progress">{project.timeline.map(step => <li key={step.stage} aria-current={step.current ? 'step' : undefined} className={step.current ? 'current' : step.complete ? 'complete' : ''}><span>{step.complete ? '✓' : step.current ? '●' : '○'}</span>{step.label}</li>)}</ol>
    <div className="v2-status-grid"><p><strong>Preview</strong><br/>{project.previewAvailable ? 'Available for review' : 'Not available yet'}</p><p><strong>Approval</strong><br/>{project.approval.replaceAll('_', ' ')}</p><p><strong>Delivery</strong><br/>Private handoff unavailable</p></div>
    <div className="v2-actions">{project.previewHref && <a className="v2-button v2-red" href={project.previewHref} target="_blank" rel="noreferrer">Open preview ↗</a>}{!detail && <Link className="v2-button v2-quiet" href="/client/projects/current">View project ↗</Link>}{detail && <Link className="v2-button v2-quiet" href="/checkout">Payment review ↗</Link>}</div>
    {detail && <p className="v2-notice" role="status">Online approval, messaging, downloads and payment are unavailable. Please use your existing contact channel for feedback.</p>}
  </article>;
}
