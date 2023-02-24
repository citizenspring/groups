import {describe, expect, test} from '@jest/globals';
import supabase from "../utils/supabase-admin.server";
import * as queries from "../utils/supabase-queries";


describe("testing supabase-queries", () => {

  beforeAll(async () => {
    await supabase.rpc("truncate_tables", { username: 'postgres'});
  })

  test("create new group", async () => {
    const { data } = await queries.createGroup("citizencorner.brussels", "requests");
    expect(data!.uuid).toMatch(/^[0-9A-F]{8}-[0-9A-F]{4}-4[0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i);
    await queries.createGroup("citizencorner.brussels", "requests");
    const { count } = await supabase.from('groups').select('*', { count: 'exact' });
    expect(count).toEqual(1);
  });

  test("un/follow group", async () => {

    await queries.createGroup("citizencorner.brussels", "events");

    await queries.follow("xavier@gmail.com", "citizencorner.brussels", "events");
    const { count } = await supabase.from('subscriptions').select('*', { count: 'exact' });
    expect(count).toEqual(1);
    await queries.unfollow("xavier@gmail.com", "citizencorner.brussels", "events");
    const { count: nc } = await supabase.from('subscriptions').select('*', { count: 'exact' });
    expect(nc).toEqual(0);
  })

  test("un/follow thread", async () => {
    await queries.createGroup("citizencorner.brussels", "requests");
    const { data: group } = await queries.createGroup("citizencorner.brussels", "events");
    const slug = "hello-world";
    await queries.createThread({
      group_uuid: group?.uuid,
      subject: "hello world",
      domain: "citizencorner.brussels",
      slug
    });

    await queries.follow("xavier@gmail.com", "citizencorner.brussels", "requests");
    await queries.follow("xavier@gmail.com", "citizencorner.brussels", "requests"); // should fail silently (already subscribed)
    await queries.follow("xavier@gmail.com", "citizencorner.brussels", "events", slug);
    await queries.follow("xavier@gmail.com", "citizencorner.brussels", "events", slug); // should fail silently (already subscribed)
    const { count } = await supabase.from('subscriptions').select('*', { count: 'exact' });
    expect(count).toEqual(2);
    await queries.unfollow("xavier@gmail.com", "citizencorner.brussels", "events", slug);
    const { count: nc } = await supabase.from('subscriptions').select('*', { count: 'exact' });
    expect(nc).toEqual(1);

  })

  describe("get subscribers", () => {

    beforeAll(async () => {
      await Promise.all([
        queries.follow("xavier@gmail.com", "citizencorner.brussels", "requests"),
        queries.follow("xavier@gmail.com", "citizencorner.brussels", "events"),
        queries.follow("leen@gmail.com", "citizencorner.brussels", "requests"),
        queries.follow("marc@gmail.com", "citizencorner.brussels", "requests"),
      ])
      console.log(">>> before all subscribers done");
    });

    test("get all subscribers to requests@citizencorner.brussels", async () => {
      const emails = await queries.getSubscribersEmails("citizencorner.brussels", "requests");
      expect(emails.length).toEqual(3);
    });

    test("get all subscribers to events@citizencorner.brussels", async () => {
      const emails = await queries.getSubscribersEmails("citizencorner.brussels", "events");
      expect(emails.length).toEqual(1);
      expect(emails[0]).toEqual("xavier@gmail.com");
    });
    
  });

})
