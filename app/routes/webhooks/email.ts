import { processEmail } from "../../controllers/email";
import { json } from "@remix-run/node";
import type { ActionArgs } from "@remix-run/node";

const error = function (errorMessage: string, errorCode?: number) {
  console.error(errorCode, errorMessage);
  return json({
    error: errorMessage,
    code: errorCode,
  }, errorCode || 400);
};

const success = function (successObject: any) {
  console.log("200", JSON.stringify(successObject, null, 2));
  return json(successObject, 200);
};

export async function action({ request }: ActionArgs) {

  if (request.method !== "POST") {
    return json({ message: "Method not allowed" }, 405);
  }

  const payload = await request.json();

  const { error, data: newMessage } = await processEmail(payload);

  success({ message: newMessage });
};
