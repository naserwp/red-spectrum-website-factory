export function WorkflowTimeline({ hasBrief = false, stage = "draft", filesBuilt = false, slugConfirmed = false }: { hasBrief?: boolean; stage?: string; filesBuilt?: boolean; slugConfirmed?: boolean }) {
  const approved = ["build_approved", "preview_ready", "customer_approved"].includes(stage);
  const preview = ["preview_ready", "customer_approved"].includes(stage);
  const steps = [
    ["Request Received", true], ["AI Brief Generated", hasBrief], ["Slug Confirmed", slugConfirmed], ["Build Approved", approved],
    ["Website Built", filesBuilt], ["Preview Ready", preview], ["Customer Approved", stage === "customer_approved"],
  ] as const;
  const current = steps.findIndex(([, done]) => !done);
  return <ol className="wf-flow" aria-label="Website workflow">{steps.map(([label, done], index) => <li key={label} className={done ? "done" : index === current ? "current" : ""} aria-current={index === current ? "step" : undefined}>
    <span aria-hidden="true">{done ? "✓" : String(index + 1).padStart(2, "0")}</span><div><strong>{label}</strong><small>{done ? "Complete" : index === current ? "Next step" : "Upcoming"}</small></div>
  </li>)}</ol>;
}
