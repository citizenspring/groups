import { useLoaderData } from "@remix-run/react";
import supabase from "utils/supabase.server";

export const loader = async () => {
  const { error, data } = await supabase.from("groups").select("*");
  return {data};
}

export default function Index() {

  const { data } = useLoaderData();

  return (
    <div style={{ fontFamily: "system-ui, sans-serif", lineHeight: "1.4" }}>
      <h1>Hello</h1>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
}
