import supabase from "../../utils/supabase-admin.server"
import { v4 as uuidv4 } from "uuid";
import slugify from "slugify";
import type { Database } from "db_types";
import * as postmark from "postmark";
import postmarkClient from "../../utils/postmark";

import {
  html2md,
  keepAttributes,
  genUniqueID,
  removeQuotedEmails,
} from "../../utils/lib";

import { getUUID, getGroup, getThread, follow, unfollow, storeAttachments, getSubscribersEmails } from "../../utils/supabase-queries";
import { EmailAttachment, EmailPayloadSchema, type EmailPayload, type ControllerResponseType } from "../../utils/schemas";

const error = (message: string, status?: number) : ControllerResponseType<any>  => ({ error: { message }, status: status || 400} )
const success = (data: object | null) : ControllerResponseType<any> => ({ error: null, data, status: 200 });

export type Message = Database["public"]["Tables"]["messages"]["Row"];
export type Thread = Database["public"]["Tables"]["threads"]["Row"];
import type { Attachment as PostmarkAttachment, Message as PostmarkEmail } from "postmark";

export async function processEmail(payload: EmailPayload) : Promise<ControllerResponseType<any>> {

  EmailPayloadSchema.parse(payload);

  let in_reply_to: string | null =
  payload.headers["In-Reply-To"] && payload.headers["In-Reply-To"][0];
  if (
    payload.headers["X-Original-Message-Id"] &&
    payload.headers["X-Original-Message-Id"][0] === in_reply_to
  ) {
    in_reply_to = null;
  }

  const email = {
    in_reply_to,
    messageId: payload["message-id"],
    createdAt: payload.date,
    from: {
      name: payload.from.name,
      email: payload.from.email,
    },
    to: payload.to, // array
    cc: payload.cc, // array
    recipient: payload.envelope.recipient,
    subject: payload.subject,
    text: payload.text,
    html: payload.html,
    inlines: payload.inlines,
    attachments: payload.attachments,
  };

  if (!email.text && email.html) {
    email.text = html2md(email.html);
  }

  /**
   * Main actions
   *  - follow / unfollow
   *  - subscribe / unsubscribe 
   *
   * :action!group/:threadSlug@:domain
   * e.g. follow!translation/newsletter-june-4AhZ31@beescoop.be
   */
  const matches = email.recipient.match(
    /(?:([a-zA-Z]+)!)?([a-zA-Z]+)(\/[a-zA-Z0-9\-]+)?@(.+)/i
  );
  if (!matches) {
    return error(`Invalid email recipient (${email.recipient})`, 400);
  }
  const action = matches[1];
  const groupSlug = matches[2];
  const threadSlug = matches[3] && matches[3].substr(1);
  const domain = matches[4];
    
  const groupUUID = await getUUID("groups", [["domain", domain], ["slug", groupSlug]]);

  if (!groupUUID) {
    return error(`The group email ${groupSlug}@${domain} does not exist`, 404);
  }

  console.log(
    ">>> receiving mail to",
    email.recipient,
    action,
    groupSlug,
    threadSlug,
    domain
  );

  let err, data;

  console.log(">>> action", action);

  switch (action) {
    case "follow":
    case "subscribe":
      ({ error: err, data } = await follow(
        email.from.email,
        domain,
        groupSlug,
        threadSlug
      ));
      if (err) return error(err.message);
      return success(data);
    case "unfollow":
    case "unsubscribe":
      ({ error: err, data } = await unfollow(
        email.from.email,
        domain,
        groupSlug,
        threadSlug
      ));
      if (err) return error(err.message);
      return success(data);
  }

  let qr, thread: Thread;
  console.log(">>> in reply to", threadSlug, email.in_reply_to);
  if (threadSlug) {
    email.text = removeQuotedEmails(email.text);
    thread = await getThread(domain, threadSlug);

    // We subscribe whoever responded to the thread to subsequent responses
    await follow(email.from.email, domain, groupSlug, threadSlug);
  } else {
    qr = await supabase
      .from("threads")
      .insert({
        uuid: uuidv4(),
        domain,
        subject: email.subject,
        from_name: email.from.name,
        from_email: email.from.email,
        slug: `${slugify(email.subject).toLowerCase()}-${genUniqueID(6)}`,
        message_id: email.messageId,
        group_uuid: groupUUID,
      })
      .select();

    if (qr.error) {
      return error(qr.error.message, qr.status);
    }
    thread = qr.data[0] as Thread;

    // The subscribe the sender to responses to this new thread
    await follow(email.from.email, domain, groupSlug, thread.slug!);
  }

  if (!thread.uuid) {
    return error("No thread.uuid");
  }

  const inlines = await storeAttachments(
    domain,
    thread.uuid,
    email.inlines,
    true
  );
  const attachments = await storeAttachments(
    domain,
    thread.uuid,
    email.attachments
  );

  // No need to store all attributes
  inlines && keepAttributes(inlines as any[], [
    "type",
    "name",
    "cid",
    "inline",
    "url",
    "dimensions",
  ]);
  attachments && keepAttributes(attachments as any[], [
    "type",
    "name",
    "cid",
    "inline",
    "url",
    "dimensions",
  ]);

  const newMessage = {
    message_id: email.messageId,
    from_name: email.from.name,
    from_email: email.from.email,
    text: email.text,
    html: email.html,
    inlines,
    attachments,
    sent_at: email.createdAt,
    thread_uuid: thread.uuid,
  };

  qr = await supabase.from("messages").insert(newMessage).select().single();

  await dispatchEmailToSubscribers(domain, groupSlug, thread.slug!, email);

  console.log(">>> message recorded", qr);
  return success(qr.data);
}

const SEND_EMAIL = true;

export const dispatchEmailToSubscribers = async function (domain: string, groupSlug: string, threadSlug: string, email: any) {

  const postmarkAttachments: PostmarkAttachment[] = [];
  if (email.attachments && email.attachments.length > 0) {
    email.attachments.map((a: EmailAttachment) => {
      return postmarkAttachments.push(new postmark.Models.Attachment(a.name, a.content, a.type, a.cid));
    });
  }
  if (email.inlines && email.inlines.length > 0) {
    email.inlines.map((a: EmailAttachment) => {
      return postmarkAttachments.push(new postmark.Models.Attachment(a.name, a.content, a.type, a.cid));
    });
  }

  // If new thread, we get the list of subscribers at the group level
  const isNewThread = !email.in_reply_to;
  const unsubscribeEmailAddress = isNewThread ? `${groupSlug}@${domain}` : `${groupSlug}/${threadSlug}@${domain}`;
  const group = await getGroup(domain, groupSlug);
  if (!group) throw Error(`Group ${groupSlug}@${domain} not found`);
  const recipients = await getSubscribersEmails(domain, groupSlug, isNewThread ? undefined : threadSlug);
  console.log(">>> getSubscribersEmails", recipients);
  const From = group.title ? `${group.title} <${groupSlug}@${domain}>` : `${groupSlug}@${domain}`;
  const emailsToSend: PostmarkEmail[] = recipients.filter(r => r !== email.from.email).map(r => {
    const msg: PostmarkEmail = {
      From,
      To: r || undefined,
      Subject: email.subject || "",
      TextBody: email.text || undefined,
      HtmlBody: email.html || undefined,
      Attachments: postmarkAttachments,
      TrackOpens: true,
      ReplyTo: `${groupSlug}/${threadSlug}@${domain}`,
      Tag: "test",
      Headers: [
        { Name: "List-Unsubscribe", Value: `<mailto:unsubscribe!${unsubscribeEmailAddress}?subject=Unsubscribe>`},
        { Name: "List-Subscribe", Value: `<mailto:subscribe!${unsubscribeEmailAddress}?subject=Subscribe>`}
      ]
    }
    return msg
  });

  let res, error;
  console.log(">>> emailsToSend", emailsToSend);
  try {
      res = SEND_EMAIL && await postmarkClient.sendEmailBatch(emailsToSend);
      console.log(">>> res", res);
  } catch (e) {
    console.error(e);
    error = (e as Error).message;
  }

  return { res, error };

}