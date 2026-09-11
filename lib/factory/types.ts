export type VerificationState = "verified" | "draft" | "missing";
export interface EvidenceField { value: string; status: VerificationState; source?: string; }
export interface CustomerBrief {
  schemaVersion: "1.0";
  project: { businessName: string; slug: string; industry: string; templateId: string };
  contact: { phone: EvidenceField; email: EvidenceField; address: EvidenceField };
  content: { primaryService: EvidenceField; serviceAreas: EvidenceField; differentiators: EvidenceField };
  assets: { logoSupplied: boolean; sourceWebsite: string; notes: string };
  formDelivery: { provider: "sendgrid"; mode: "disabled" | "test" | "live"; recipientConfirmed: boolean; testPassed: boolean };
  approval: { approvedBy: string; approvedAt: string };
}
