import { z } from "zod";

/**
 * The only events the app records. They say *what kind of thing happened in which tool* — never
 * what the user typed, uploaded or generated.
 */
export const ANALYTICS_EVENTS = [
  "tool_opened",
  "calculation_completed",
  "invoice_created",
  "quotation_created",
  "pdf_generated",
  "image_compressed",
  "qr_generated",
  "download_clicked",
] as const;
export type AnalyticsEventName = (typeof ANALYTICS_EVENTS)[number];

export const EVENT_LABEL: Record<AnalyticsEventName, string> = {
  tool_opened: "Tool opened",
  calculation_completed: "Calculation completed",
  invoice_created: "Invoice created",
  quotation_created: "Quotation created",
  pdf_generated: "PDF generated",
  image_compressed: "Image compressed",
  qr_generated: "QR code generated",
  download_clicked: "Download clicked",
};

export const eventPayloadSchema = z.object({
  name: z.enum(ANALYTICS_EVENTS),
  tool: z.string().max(60).optional(),
  /** Random id kept in this browser only; not linked to accounts. */
  visitorId: z.uuid(),
});
export type EventPayload = z.infer<typeof eventPayloadSchema>;
