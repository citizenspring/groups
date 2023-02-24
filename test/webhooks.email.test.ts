import {describe, expect, test} from '@jest/globals';
import supabase from "../utils/supabase-admin.server";
import * as queries from "../utils/supabase-queries";

import { processEmail } from '../app/controllers/email';
import emailSubscribe from "../dbseed/subscribe-newsletter.json";
import emailUnsubscribe from "../dbseed/unsubscribe-newsletter.json";
import email1 from "../dbseed/email1.json";
import email2 from "../dbseed/email2.json";
import email3 from "../dbseed/email3.json";

import { Database } from 'db_types';

export type Thread = Database["public"]["Tables"]["threads"]["Row"];
export type Subscription = Database["public"]["Tables"]["subscriptions"]["Row"];

const mockedUpload = jest.spyOn(queries, "uploadToSupabaseStorage").mockResolvedValue({ data: { signedUrl: "https://..."}});

async function count(table: string): Promise<number> {
  const { count } = await supabase.from(table).select('*', { count: 'exact' });
  return count as number;
}

describe("test email webhook", () => {

  beforeAll(async () => {
    await supabase.rpc("truncate_tables", { username: 'postgres'});
    // await supabase.storage.emptyBucket('attachments');
  })

  test("returns error if group does not exist", async () => {
    const res = await processEmail(email1);
    expect(res.error?.message).toEqual("The group email requests@citizencorner.brussels does not exist");
    expect(res.status).toEqual(404);
  });

  test("creates a new thread", async () => {
    
    await queries.createGroup("citizencorner.brussels", "requests");
    // const mockedUpload = (queries.uploadToSupabaseStorage as jest.Mock).mockResolvedValue('mocked result');
    const { error, data } = await processEmail(email1);
    if (error) console.log(">>> error", error);
    const threadRecord: Thread = await queries.getThreadByMessageId(email1['message-id']); 
    expect(threadRecord).not.toBeNull();
    expect(threadRecord.subject).toEqual(email1.subject);
    expect(threadRecord.domain).toEqual("citizencorner.brussels");
    expect(mockedUpload.mock.calls.length).toEqual(2);
    expect(mockedUpload.mock.calls[0][0]).toMatch(/^citizencorner\.brussels\/.*\.png$/)
    expect(mockedUpload.mock.calls[0][1]).toEqual('image/png')
    expect(mockedUpload.mock.calls[1][0]).toMatch(/^citizencorner\.brussels\/.*\.png$/)
    expect(mockedUpload.mock.calls[1][1]).toEqual('image/png')

    const attachmentsRecorded = await count("attachments");
    expect(attachmentsRecorded).toEqual(2);
  });

  test.only("subscribe & unsubscribe from newsletter@citizencorner.brussels", async () => {
    await queries.createGroup("citizencorner.brussels", "newsletter", "newsletter");
    await processEmail(emailSubscribe);
    let subscriptions: (Subscription|null)[] = await queries.getSubscriptions("citizencorner.brussels", "newsletter");
    console.log(">>> subscriptions", subscriptions);
    expect(subscriptions.length).toEqual(1);
    expect(subscriptions[0]?.email).toEqual(emailSubscribe.from.email);
    const { error, data } = await processEmail(emailUnsubscribe);
    if (error) console.log(">>> error", error);
    subscriptions = await queries.getSubscriptions("citizencorner.brussels", "newsletter");
    expect(subscriptions.length).toEqual(0);
  });
});
