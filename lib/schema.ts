import { z } from "zod";

export const CategorySchema = z.enum([
  "Roads",
  "Waste",
  "Water",
  "Electricity",
  "Trees",
  "Drainage",
  "Other",
]);
export type Category = z.infer<typeof CategorySchema>;

export const IntentSchema = z.enum([
  "complaint",
  "greeting",
  "status_query",
  "help",
  "chitchat_or_non_civic",
  "needs_more_info",
]);
export type Intent = z.infer<typeof IntentSchema>;

export const SeveritySchema = z.enum(["Low", "Medium", "High", "Critical"]);
export type Severity = z.infer<typeof SeveritySchema>;

export const TicketStatusSchema = z.enum(["open", "in_progress", "resolved"]);
export type TicketStatus = z.infer<typeof TicketStatusSchema>;

/**
 * Raw output schema from Gemini API / Fallback engine
 */
export const TriageResultSchema = z.object({
  intent: IntentSchema.default("complaint"),
  category: CategorySchema,
  severity: SeveritySchema,
  severity_reason: z.string(),
  department: z.string(),
  summary: z.string(),
  detected_language: z.string(),
  translated_text: z.string(),
  location_hint: z.string().default(""),
  confidence: z.number().min(0).max(1),
  suggested_action: z.string(),
  urgency_signals: z.array(z.string()).default([]),
  image_changed_result: z.boolean().optional().default(false),
  source: z.enum(["ai", "fallback"]).default("ai"),
});
export type TriageResult = z.infer<typeof TriageResultSchema>;

export const AuditEventSchema = z.object({
  id: z.string(),
  timestamp: z.string(),
  actor: z.string(), // "System (AI)", "System (Fallback)", "Officer Sharma", etc.
  action: z.string(), // "CREATED", "TRIAGED", "STATUS_CHANGE", "OFFICER_OVERRIDE", "DISPATCHED"
  details: z.string(),
});
export type AuditEvent = z.infer<typeof AuditEventSchema>;

export const PriorityBreakdownSchema = z.object({
  base_severity_score: z.number(), // e.g. Critical=50, High=35, Med=20, Low=10
  sensitive_proximity_boost: z.number(), // e.g. +20 if near school/hospital
  duplicate_frequency_boost: z.number(), // e.g. +5 per duplicate up to +20
  aging_boost: z.number(), // e.g. up to +10 as time passes
  total_score: z.number().min(0).max(100),
  explanation: z.string(),
});
export type PriorityBreakdown = z.infer<typeof PriorityBreakdownSchema>;

export const TicketSchema = z.object({
  id: z.string(),
  created_at: z.string(),
  raw_text: z.string(),
  image_url: z.string().optional(),
  
  // Triage output
  intent: IntentSchema.optional(),
  category: CategorySchema,
  severity: SeveritySchema,
  severity_reason: z.string(),
  department: z.string(),
  summary: z.string(),
  detected_language: z.string(),
  translated_text: z.string(),
  location_hint: z.string(),
  confidence: z.number(),
  suggested_action: z.string(),
  urgency_signals: z.array(z.string()),
  image_changed_result: z.boolean().default(false),
  source: z.enum(["ai", "fallback"]),

  // Operational metadata
  status: TicketStatusSchema.default("open"),
  assigned_to: z.string().optional().default("Unassigned"),
  priority_score: z.number().min(0).max(100),
  priority_breakdown: PriorityBreakdownSchema,
  sla_hours: z.number(),
  sla_deadline: z.string(),
  is_overdue: z.boolean().default(false),

  // Duplicate clustering
  cluster_id: z.string().optional(),
  duplicate_count: z.number().default(1),
  possible_duplicate_of: z.string().optional(),

  // Human review & override
  needs_human_review: z.boolean().default(false),
  is_overridden: z.boolean().default(false),
  officer_override: z
    .object({
      original_category: CategorySchema,
      original_severity: SeveritySchema,
      original_department: z.string(),
      officer_name: z.string(),
      override_timestamp: z.string(),
      reason: z.string().optional(),
    })
    .optional(),

  audit_trail: z.array(AuditEventSchema),
});
export type Ticket = z.infer<typeof TicketSchema>;

export const CreateComplaintSchema = z.object({
  text: z.string().min(3, "Complaint text must be at least 3 characters long"),
  image_base64: z.string().optional(),
  image_mime: z.string().optional(),
  channel: z.enum(["web_citizen", "whatsapp", "sms", "voice"]).default("web_citizen"),
});
export type CreateComplaintInput = z.infer<typeof CreateComplaintSchema>;

export const OfficerOverrideSchema = z.object({
  ticket_id: z.string(),
  category: CategorySchema.optional(),
  severity: SeveritySchema.optional(),
  department: z.string().optional(),
  status: TicketStatusSchema.optional(),
  assigned_to: z.string().optional(),
  officer_name: z.string().default("Duty Officer"),
  reason: z.string().optional(),
});
export type OfficerOverrideInput = z.infer<typeof OfficerOverrideSchema>;
