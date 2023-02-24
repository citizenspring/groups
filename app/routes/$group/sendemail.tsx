import recipients from "../../../newsletter.subscribers.test.json";
import { useLoaderData } from "@remix-run/react";
import postmark from "utils/postmark";
import type { Message } from "postmark";
import { getHTMLFromGoogleDocId } from "utils/googledoc";

const fs = require('fs');
let resetStyles = "", emailStyles = "";
try {
  resetStyles = fs.readFileSync("./app/styles/email_reset.css", 'utf8');
  emailStyles = fs.readFileSync("./app/styles/email_styles.css", 'utf8');
} catch (err) {
  console.error(err);
}


// const googleDocId = "1fa-uv6vbigvSNITEBMjz4U56MwDhq9L8Roj24OLvn9E"; // 2022-12
// const googleDocId = "1HHKBvpevedyz364I7v55PYR-mmlM1fE96kKTw_GT-iI"; // 2023-01
// const googleDocId = "1rucvKU34MtvZiGbW5u6VF38vzIiYTf15qjYHO1lD1L0"; // 2023-02 EN
const googleDocId = "1990h6J3_wWY6zEoCQSQIOVJwgzKQH1RrsgeVV485Duo"; // 2023-02 FR
const SEND_EMAIL = true;

export const loader = async () => {
  const doc = await getHTMLFromGoogleDocId(googleDocId, "email");
  let res, error;

  const html = `
<!DOCTYPE html>
<html>
  <head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
      ${resetStyles.replace(/\/\*.*\/$/gm, "")}
      ${emailStyles}
    </style>
  </head>
  <body style="width: 100%; margin: 0; padding: 0;">
  ${doc?.body}
  <div><center><a href="mailto:newsletter@citizencorner.brussels?subject=unsubscribe" style="color:#555;font-size:9pt;text-decoration:none;">unsubscribe</a></center></div>
  </body>
</html>
`;

// console.log(">>> sending html", html);

// see https://www.rfc-editor.org/rfc/rfc2369
const emailsToSend: Message[] = recipients.map(r => {
    const msg: Message = {
      From: "Citizen Corner Newsletter <newsletter@citizencorner.brussels>",
      To: r,
      Subject: doc?.title || "",
      HtmlBody: html,
      TrackOpens: true,
      Tag: "newsletter",
      Headers: [
        { Name: "List-Unsubscribe", Value: "<mailto:newsletter@citizencorner.brussels?subject=unsubscribe>"},
        { Name: "List-Subscribe", Value: "<mailto:newsletter@citizencorner.brussels?subject=subscribe>"},
      ]
    }
    return msg
  });

try {
    res = SEND_EMAIL && await postmark.sendEmailBatch(emailsToSend);
    console.log(">>> res", res);
  } catch (e) {
    console.error(e);
    error = e.message;
  }
  return { doc, html, res, error };
}

export default function SendEmail() {
  const { doc, html } = useLoaderData();
  return (<>
    <h1>{doc.title}</h1>
    <div dangerouslySetInnerHTML={{__html: html}} />
    {/* <div>{html}</div> */}
  </>);
}