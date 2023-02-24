import supabase from "./supabase-admin.server";
import type { Database, Json } from '../db_types';
import { map, find } from "lodash";
import sizeOf from "image-size";
import type { EmailAttachment } from "./schemas";
import { PostgrestMaybeSingleResponse, PostgrestResponse, PostgrestSingleResponse } from "@supabase/supabase-js";
import type { StorageError } from "@supabase/storage-js";
export type Attachment = Database["public"]["Tables"]["attachments"]["Row"];
export type Group = Database["public"]["Tables"]["groups"]["Row"];
export type Thread = Database["public"]["Tables"]["threads"]["Row"];
export type Subscription = Database["public"]["Tables"]["subscriptions"]["Row"];

function logError(label: string, error: any & { message: string }, verbose?: boolean) : void {
  if (error) console.error("!!!", label, verbose ? error : error.message);
}


export type StorageResponse = {
  error?: StorageError | null,
  data?: {
    signedUrl: string
  }
}

export async function createGroup(domain: string, slug: string, type?: string): Promise<PostgrestSingleResponse<Group>> {
  const res = await supabase.from("groups").upsert({ domain, slug, type }).select('*').single();

  if (res.error) console.log("createGroup error", res.error);
  return res;
}

export async function createThread(threadData: Partial<Thread>) : Promise<PostgrestSingleResponse<Thread>> {
  return await supabase.from("threads").upsert(threadData as Thread).select('*').single();
}

export async function getGroup(domain: string, groupSlug: string) : Promise<Group | null> {
  const { error, data } = await supabase.from("groups").select("*").eq("domain", domain).eq("slug", groupSlug).single();
  if (error) return null;
  return data as Group;
}

export async function getGroupUUID(domain: string, groupSlug: string) : Promise<string | null> {
  const group = await getGroup(domain, groupSlug);
  if (!group) return null;
  return group.uuid;
}

export async function getUUID(table: string, conditions: string[][]) : Promise<string | null> {
  const query = supabase.from(table).select("uuid");
  conditions.forEach(condition => {
    query.eq(condition[0], condition[1])
  })
  const res = await query.single();
  return res.data?.uuid;
}

export async function follow(email: string, domain: string, groupSlug: string, threadSlug?: string) : Promise<PostgrestMaybeSingleResponse<Subscription>> {

  const calls = [
    getGroupUUID(domain, groupSlug)
  ];
  
  if (threadSlug) {
    calls.push(getUUID("threads", [["domain", domain], ["slug", threadSlug]]));
  }

  const uuids = await Promise.all(calls);

  if (!uuids[0]) throw new Error(`Can't follow ${groupSlug}@${domain}: ${groupSlug} group not found`);
  if (threadSlug && !uuids[1]) throw new Error(`Can't follow ${groupSlug}/${threadSlug}@${domain}: ${threadSlug} thread not found`);

  const subscriptionRecord = { 
    email,
    domain, 
    group_uuid: uuids[0],
    thread_uuid: uuids[1] || null
  };
  return await supabase.from("subscriptions").upsert(subscriptionRecord).select("*").single();
}

export async function unfollow(email: string, domain: string, groupSlug: string, threadSlug?: string) : Promise<PostgrestResponse<undefined>> {

  const calls = [
    getUUID("groups", [["domain", domain], ["slug", groupSlug]])
  ];
  
  if (threadSlug) {
    calls.push(getUUID("threads", [["domain", domain], ["slug", threadSlug]]));
  }

  const uuids = await Promise.all(calls);

  if (!uuids[0]) throw new Error(`Can't unfollow ${groupSlug}@${domain}: ${groupSlug} group not found`);
  if (threadSlug && !uuids[1]) throw new Error(`Can't unfollow ${groupSlug}/${threadSlug}@${domain}: ${threadSlug} thread not found`);

  const query = supabase.from("subscriptions")
    .delete()
    .eq("domain", domain)
    .eq("group_uuid", uuids[0]);

  if (threadSlug) {
    query.eq("thread_uuid", uuids[1]);
  }

  return await query;
}

export async function getSubscriptions(domain: string, groupSlug: string, threadSlug?: string) : Promise<(Subscription|null)[]> {
  const calls = [
    getUUID("groups", [["domain", domain], ["slug", groupSlug]])
  ];
  
  if (threadSlug) {
    calls.push(getUUID("threads", [["domain", domain], ["slug", threadSlug]]));
  }

  const uuids = await Promise.all(calls);

  const query = supabase.from("subscriptions")
    .select("email")
    .eq("domain", domain)
    .eq("group_uuid", uuids[0]);

  if (threadSlug) {
    query.eq("thread_uuid", uuids[1]);
  }

  const { error, data } = await query;

  if (!data) return [];

  return data as Subscription[];
}

export async function getSubscribersEmails(domain: string, groupSlug: string, threadSlug?: string | undefined) : Promise<(string|null)[]> {
  console.log(">>> getSubscribersEmails", domain, groupSlug, threadSlug);
  const subscriptions = await getSubscriptions(domain, groupSlug, threadSlug);
  if (!subscriptions || subscriptions.length === 0) return [];
  return subscriptions.map(r => r && r.email);
}


export const uploadToSupabaseStorage = async (filepath: string, contentType: string, file: Buffer) : Promise<StorageResponse> => {
  let err: any, data: any;
  ({ error: err, data } = await supabase.storage
    .from("attachments")
    .upload(filepath, file, { contentType }));
  if (err) {
    console.error(">>> error uploading", filepath, err);
    return { error: err };
  } else {
    console.log(">>> uploaded", data);
  }
  const res = await supabase.storage
    .from("attachments")
    .createSignedUrl(filepath, 60 * 60 * 24 * 30 * 12 * 4);

  return res as StorageResponse;
}

/**
 * Store attachments that have not already been shared in the thread in supabase storage
 * @param domain 
 * @param threadUUID 
 * @param attachments array of EmailAttachment
 * @param isInline boolean
 * @returns array of Attachment objects
 */
export const storeAttachments = async function (
  domain: string,
  threadUUID: string,
  attachments?: EmailAttachment[],
  isInline?: boolean
) : Promise<Attachment[] | null> {
  if (!attachments || attachments.length === 0) {
    console.log("storeAttachments: No attachment to store");
    return null;
  }

  const uploadCall = async (emailAttachment : EmailAttachment) : Promise<Attachment | null> => {
    const file = Buffer.from(emailAttachment.content, "base64");
    const filepath = `${domain}/${threadUUID}/${emailAttachment.name}`;
    const dimensions: any = emailAttachment.type.match(/^image?/) ? sizeOf(file) : null;
    console.log("> Uploading", filepath, dimensions);

    let err, data;
    ({ error: err, data } = await uploadToSupabaseStorage(filepath, emailAttachment.type, file));
    if (err) {
      return null;
    }
    const emailAttachmentUrl: string | undefined = data?.signedUrl;

    const attachmentRecord: Partial<Attachment> = {
      domain,
      thread_uuid: threadUUID,
      type: emailAttachment.type,
      dimensions,
      name: emailAttachment.name,
      cid: emailAttachment.cid,
      inline: isInline,
      url: emailAttachmentUrl
    };

    ({ error: err, data } = await supabase
      .from("attachments")
      .insert(attachmentRecord)
      .select("*")
      .single());

    if (err) {
      console.error(">>> error inserting attachment", err);
      return null;
    } else {
      return data as unknown as Attachment;
    }
  };

  const cids = map(attachments, "cid");
  console.log(">>> storeAttachments cids:", cids);

  const { error: err, data } = await supabase
    .from("attachments")
    .select()
    .eq("domain", domain)
    .eq("thread_uuid", threadUUID)
    .in("cid", cids);

  if (err) {
    console.error(">>> error", err);
  }
  const cids_stored = data;
  console.log(">>> cids found for current thread", cids_stored);

  const asyncCalls = [];
  for (let i = 0; i < attachments.length; i++) {
    const attachment = attachments[i];
    const cid_found = find(cids_stored, { cid: attachment.cid });
    if (cid_found) {
      console.log(`cid ${attachment.cid} already stored, skipping`);
      asyncCalls.push(new Promise((resolve) => resolve(cid_found as Json)));
    } else {
      asyncCalls.push(uploadCall(attachment));
    }
  }
  const attachementRecords = await Promise.all(asyncCalls);
  console.log(">>> attachementRecords", attachementRecords);
  return attachementRecords.filter(n => n) as Attachment[];
};

export const getThread = async function(domain: string, threadSlug: string) : Promise<Thread> {
  const { error, data } = await supabase.from("threads").select("*").eq("domain", domain).eq("slug", threadSlug).single();
  return data as Thread;
}
export const getThreadByMessageId = async function(message_id: string) : Promise<Thread> {
  const { error, data } = await supabase.from("threads").select("*").eq("message_id", message_id).single();
  return data as Thread;
}

export const getGroupByUUID = async function(uuid: string) : Promise<Group> {
  const { error, data } = await supabase.from("groups").select("*").eq("uuid", uuid).single();
  return data as Group;
}

export const getThreadByUUID = async function(uuid: string) : Promise<Thread> {
  const { error, data } = await supabase.from("threads").select("*").eq("uuid", uuid).single();
  return data as Thread;
}

