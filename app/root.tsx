import { json } from "@remix-run/node";
import type {  LoaderArgs, MetaFunction } from "@remix-run/node";
import {
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
} from "@remix-run/react";
import { createClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "db_types";
import styles from "./styles/app.css"
import { useState } from "react";
import Footer from "../components/Footer";
import supabase from "utils/supabase.server";
import { getDomain } from "utils/lib";

type TypeSupabaseClient = SupabaseClient<Database>;

export type SupabaseOutletContext = {
  supabase: TypeSupabaseClient
}

export function links() {
  return [{ rel: "stylesheet", href: styles }]
}

export const meta: MetaFunction = () => ({
  charset: "utf-8",
  title: "New Remix App",
  viewport: "width=device-width,initial-scale=1",
});

export const loader = async ({ request, params }: LoaderArgs) => {
  const env = {
    SUPABASE_URL: process.env.SUPABASE_URL!,
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY!
  }

  const domain: string = getDomain(request);

  console.log(">>> root: params", params);

  const { error, data: groups } = await supabase.from("groups")
    .select("slug,title,googleDocId")
    .eq("domain", domain)
    .order('position', { ascending: true });

  return json({ env, groups, params });
}

export default function App() {

  const { env, groups, params } = useLoaderData<typeof loader>();
  const [ supabase ] = useState(() => createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY));

  return (
    <html lang="en">
      <head>
        <Meta />
        <Links />
      </head>
      <body>
      <main className="relative min-h-screen w-full overflow-hidden p-4">
        <Outlet context={{supabase}} />
        </main>

      <Footer groups={groups} params={params} />
        {/* make sure tailwind includes the .imageWrapper.fullWidth classes in production */}
        <span className="imageWrapper fullWidth"></span>

        <ScrollRestoration />
        <Scripts />
        <LiveReload />
      </body>
    </html>
  );
}

export function ErrorBoundary({ error }) {
  // fail silently on HMR requests
  if (error.message.indexOf("Invalid domain (_next)") !== -1) {
    return <>Nothing to see here</>;
  }
  console.error("root: Catching an error here!:", `"${error.message}"`, error);
  return (
    <html>
      <head>
        <title>Oh no!</title>
        <Meta />
        <Links />
      </head>
      <body>
        {/* add the UI you want your users to see */}
        <Scripts />
      </body>
    </html>
  );
}