import { useLoaderData } from "@remix-run/react";
import supabase from "utils/supabase.server";
import Navbar from "../../../components/Navbar";
import Breadcrumb from "../../../components/Breadcrumb";
import Avatar from "../../../components/Avatar";
import DateTime from "../../../components/DateTime";
import Message from "../../../components/Message";
import { getDomain, debug } from "utils/lib";
import { LoaderArgs } from "@remix-run/node";

export const loader = async ({ request, params }: LoaderArgs) => {
  console.log(">>> loader params", params);

  const domain: string = getDomain(request);

  const { data: thread } = await supabase
    .from("threads")
    .select("*")
    .eq("domain", domain)
    .eq("slug", params.thread)
    .single();

  const { data: messages } = await supabase
    .from("messages")
    .select("*")
    .eq("thread_uuid", thread.uuid);

  const data = { thread, messages, params };
  console.log(">>> data", data);
  return data;
};

export default function Index() {
  const loaderData = useLoaderData();
  const { thread, messages, params } = loaderData;
  debug(loaderData);

  return (
    <>
      <Navbar
        domain={params.domain}
        group={params.group}
        thread={thread.slug}
      />

      <div className="container mx-auto">

        <Breadcrumb
          domain={params.domain}
          group={params.group}
          thread={params.thread}
        />

        <div className="flex flex-col mt-8">
          <h1>{thread.subject}</h1>

          {messages.map((message, index) => (
            <Message index={index} data={message} key={index} />
          ))}

        </div>
      </div>
    </>
  );
}
