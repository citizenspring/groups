import {describe, expect, test} from '@jest/globals';
import supabase from "../utils/supabase-admin.server";
import * as queries from "../utils/supabase-queries";
import postmarkClient from "../utils/postmark";

import { processEmail } from '../app/controllers/email';
import emailSubscribe from "../dbseed/subscribe-newsletter.json";
import emailUnsubscribe from "../dbseed/unsubscribe-newsletter.json";
import email1 from "../dbseed/email1.json";
import email2 from "../dbseed/email2.json";
import email3 from "../dbseed/email3.json";

import { Database } from 'db_types';

export type Thread = Database["public"]["Tables"]["threads"]["Row"];
export type Subscription = Database["public"]["Tables"]["subscriptions"]["Row"];

const mockedPostmarkClient = jest.spyOn(postmarkClient, "sendEmailBatch").mockResolvedValue([{ To: "", MessageID: "", SubmittedAt: "", ErrorCode: 0, Message: "OK" }]);
const mockedUpload = jest.spyOn(queries, "uploadToSupabaseStorage").mockResolvedValue({ data: { signedUrl: "https://..."}});

async function count(table: string): Promise<number> {
  const { count } = await supabase.from(table).select('*', { count: 'exact' });
  return count as number;
}

const recipients = ["xdamman+test1@gmail.com", "xdamman+test2@opencollective.com"];
describe("test email webhook", () => {

  beforeAll(async () => {
    await supabase.rpc("truncate_tables", { username: 'postgres'});
    await queries.createGroup("citizencorner.brussels", "requests");
    await queries.follow(recipients[0], "citizencorner.brussels", "requests");
    await queries.follow(recipients[1], "citizencorner.brussels", "requests");
    const { error, data } = await processEmail(email1);
    if (error) console.log(">>> error", error);
  })

  test("sends new thread to the 2 subscribers", async () => {
    
    // const mockedPostmarkClient = (queries.uploadToSupabaseStorage as jest.Mock).mockResolvedValue('mocked result');
    expect(mockedPostmarkClient.mock.calls.length).toEqual(1);
    // console.log(">>> mockedPostmarkClient.mock.calls", mockedPostmarkClient.mock.calls[0][0][0])
    expect(mockedPostmarkClient.mock.calls[0][0][0].To).toEqual(recipients[0]);
    expect(mockedPostmarkClient.mock.calls[0][0][1].To).toEqual(recipients[1]);
  
  });

  test("Adds the person that responds as a subscriber to the thread", async () => {
    const ReplyTo = mockedPostmarkClient.mock.calls[0][0][1].ReplyTo;
    console.log(">>> mockedUpload.mock.calls.length", mockedUpload.mock.calls.length);
    email2.from.email = "leen@gmail.com";
    email2.envelope.recipient = ReplyTo!;
    await processEmail(email2);
    console.log(">>> mockedUpload.mock.calls.length", mockedUpload.mock.calls.length);
    const threadSlug = ReplyTo!.substring(ReplyTo!.indexOf("/")+1, ReplyTo!.indexOf("@"));
    console.log(">>> ReplyTo", ReplyTo, "thread", threadSlug);
    const subscribers = await queries.getSubscribersEmails("citizencorner.brussels", "requests", threadSlug);
    console.log(">>> subscribers", subscribers);
    expect(subscribers.length).toEqual(2);
    expect(subscribers[0]).toEqual(email2.from.email);
  });


});
