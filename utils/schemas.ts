import z from "zod";

export const EmailAttachmentSchema = z.object({
  type: z.string().regex(/.+\/.+/),
  name: z.string(),
  content: z.string(),
  cid: z.string()
});

export const EmailRecipientSchema = z.object({
  name: z.string().nullable(),
  email: z.string().email()
});

export const EmailPayloadSchema = z.object({
  headers: z.object({
    "In-Reply-To": z.array(z.string()).optional(),
    "X-Original-Message-Id": z.array(z.string()).optional(),
  }),
  "message-id": z.string(),
  "date": z.string(),
  from: EmailRecipientSchema,
  to: z.array(EmailRecipientSchema),
  cc: z.array(EmailRecipientSchema).optional(),
  envelope: z.object({
    recipient: z.string().email(),
  }),
  subject: z.string(),
  text: z.string(),
  html: z.string(),
  inlines: z.array(EmailAttachmentSchema).optional(),
  attachments: z.array(EmailAttachmentSchema).optional(),
})

export type EmailPayload = z.infer<typeof EmailPayloadSchema>;
export type EmailAttachment = z.infer<typeof EmailAttachmentSchema>;

export type Error = {
  message: string,
  errorNumber?: number
};

export type ControllerResponseType<T> = {
  error?: Error | null | undefined,
  data?: T | null | undefined,
  status: number
}