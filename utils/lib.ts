import TurndownService from "turndown";
import hosts from "../hosts.json";

const turndownService = new TurndownService();

export function getDomain(request: Request): string {
  const host: string = (request.headers.get('host') || "").replace(/:[0-9]+$/, "");
  if (!host) throw new Error('Missing host')
  return hosts[host] || host  || "citizencorner.brussels";
}

export function debug(loaderData: any): void {
  if (typeof window !== "undefined") {
    window.console.log("*** debug loaderData ***");
    window.console.log("Loader data", loaderData);
  }
}

export const html2md = (html: string) => {
  return turndownService.turndown(html);
};

export const removeAttribute = (array: any[], attr: string) => {
  if (!array || array.length === 0) return;
  array.forEach((a) => {
    delete a[attr];
  });
  return array;
};

export const removeAttributes = (array: any[], attrs: string[]) => {
  if (!array || array.length === 0) return;
  array.forEach((a) => {
    attrs.forEach((attr) => {
      delete a[attr];
    });
  });
  return array;
};

export const keepAttributes = (array: any[], attrs: string[]) => {
  if (!array || array.length === 0) return;
  array.forEach((a) => {
    Object.keys(a).forEach((k) => {
      if (attrs.indexOf(k) === -1) {
        delete a[k];
      }
    });
  });
  return array;
};

const trimTrailingLines = (lines: string[]) => {
  while (lines.length > 0 && lines[lines.length - 1].trim() === "") {
    lines.pop();
  }
};

export const removeQuotedEmails = (text: string) => {
  if (!text || text.indexOf("\r\n>") === -1) {
    return text;
  }

  const lines = text.split("\r\n");
  console.log(lines.length, "lines");
  const newLines: string[] = [];
  lines.forEach((l) => {
    if (!l.match(/^>+(\s?$|\s)/g)) {
      newLines.push(l);
    }
  });

  trimTrailingLines(newLines);
  if (newLines[newLines.length - 1].match(/<[^@]+@[^\.]+\.[^>]+>/)) {
    newLines.pop();
  }
  trimTrailingLines(newLines);

  return newLines.join("\r\n");
};

export const genUniqueID = function (length: number) {
  var result = "";
  var characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  var charactersLength = characters.length;
  for (var i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
};
