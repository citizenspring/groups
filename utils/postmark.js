import { ServerClient } from "postmark";

var serverToken = process.env.POSTMARK_API_TOKEN;
const client = new ServerClient(serverToken);
export default client;
