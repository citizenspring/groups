import type { LoaderArgs } from "@remix-run/node";

const allowedHosts = [
  "lh1.googleusercontent.com",
  "lh2.googleusercontent.com",
  "lh3.googleusercontent.com",
  "lh4.googleusercontent.com",
  "lh5.googleusercontent.com",
  "lh6.googleusercontent.com",
  "dl.airtable.com",
  "pbs.twimg.com"
];

export async function loader({request} : LoaderArgs) {
  
  const url = new URL(request.url);
  const imgsrc: string | null = url.searchParams.get("src");
  const imgurl = new URL(imgsrc);
  if (allowedHosts.indexOf(imgurl.hostname) === -1) {
    return new Response(`host ("${imgurl.hostname}") not in the allowed lists`, { status: 400 });
  }
  const image = await fetch(imgsrc);
  return new Response(image.body, {
    status: 200,
    headers: image.headers
  });

}