import { useLoaderData } from "@remix-run/react";
import { getHTMLFromGoogleDocId } from "utils/googledoc";
import { getDomain, debug } from "utils/lib";
import RenderGoogleDoc from "components/GoogleDoc/RenderGoogleDoc";
import Navbar from "components/Navbar";
import Breadcrumb from "components/Breadcrumb";
import supabase from "utils/supabase.server";
import moment from "moment";
import { Link } from "@remix-run/react";
import Avatar from "components/Avatar";

import type {LoaderArgs} from "@remix-run/node";

export const loader = async ({request, params} : LoaderArgs) => {

  const domain: string = getDomain(request);
  
  console.log(">>> domain", domain, "group", params.group);

  const data = { request, error: null, threads: [] };
  if (!domain.match(/[a-z0-9_\-]+\.[a-z0-9]{2,10}/i)) {
    throw new Error(`Invalid domain (${domain})`);
  }

  const { error: fetchGroupError, data: group } = await supabase.from("groups").select("*").eq("domain", domain).eq("slug", params.group).single();
  if (fetchGroupError) {
    console.error("fetchGroupError", JSON.stringify(fetchGroupError, null, 2));
  }
  data.domain = domain;
  data.group = group;
  data.params = params;

  if (!group) {
    data.error = `Group ${params.group}@${domain} not found`;
    return data;
  }

  if (group.googleDocId) {
    group.googleDoc = await getHTMLFromGoogleDocId(group.googleDocId);
  }

  const { error: fetchThreadsError, data: threads } = await supabase.from("threads").select("*").eq("domain", domain).eq("group_uuid", group.uuid);
  data.threads = threads;
  if (fetchThreadsError) {
    console.error("fetchThreadsError", fetchThreadsError);
    data.error = fetchThreadsError;
  }
  console.log(">>> data fetched", data);
  return data;
}

export default function Index() {

  const loaderData = useLoaderData();
  const { error, params, group, threads, domain } = loaderData;

  debug(loaderData);

  if (error) {
    return (<div>{error}</div>);
  }

  if (!group) {
    return <>Group not found</>
  }

  const loadMessages = (group.type !== "page");

  return (
    <>
    { group.googleDocId && <RenderGoogleDoc html={group.googleDoc.body} /> }
    { loadMessages && (
      <>
        <Navbar
          domain={domain}
          group={group}
        />
        <div className="container mx-auto">
          <Breadcrumb
            domain={domain}
            group={params.group}
          />

          <div className="container flex flex-col items-center justify-center w-full mx-auto bg-white rounded-lg shadow dark:bg-gray-800">
            <div className="w-full px-4 py-5 border-b sm:px-6">
                <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white">
                    {group.title}
                </h3>
                <p className="max-w-2xl mt-1 text-sm text-gray-500 dark:text-gray-200">
                {group.description}
                </p>
            </div>
            <ul className="flex flex-col divide-y divide w-full">
              {threads.map((thread, i) => (
                  <li className="flex flex-row" key={i}>
                  <div className="flex items-center flex-1 p-4 cursor-pointer select-none">
                      <div className="flex flex-col items-center justify-center w-10 h-10 mr-4">
                          <a href="#" className="relative block">
                              <Avatar seed={thread.from_name} alt={thread.from_name} className="mx-auto object-cover rounded-full h-10 w-10 " />
                          </a>
                      </div>
                      <div className="flex-1 pl-1 mr-16">
                          <div className="font-medium dark:text-white">
                          <Link to={thread.slug}>{thread.subject}</Link>
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-200">
                              {thread.description}
                          </div>
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-200">
                      <time className="" dateTime={moment(thread.created_at).format('MMMM Do YYYY, h:mm:ss a')}
                        title={moment(thread.created_at).format('MMMM Do YYYY, h:mm:ss a')}>{moment(thread.created_at).fromNow()}</time>

                      </div>
                      <Link to={thread.slug}>
                      <button className="flex justify-end w-24 text-right">
                          <svg width="20" fill="currentColor" height="20" className="text-gray-500 hover:text-gray-800 dark:hover:text-white dark:text-gray-200" viewBox="0 0 1792 1792" xmlns="http://www.w3.org/2000/svg">
                              <path d="M1363 877l-742 742q-19 19-45 19t-45-19l-166-166q-19-19-19-45t19-45l531-531-531-531q-19-19-19-45t19-45l166-166q19-19 45-19t45 19l742 742q19 19 19 45t-19 45z">
                              </path>
                          </svg>
                      </button>
                      </Link>
                  </div>
              </li>
              ))}
            </ul>
          </div>
        </div>
      </>
    )}
    </>
  );
}
