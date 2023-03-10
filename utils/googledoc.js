"server only";

import fetch from "node-fetch";
import cheerio from "cheerio";
import { renderToStaticMarkup as renderToString } from "react-dom/server";
import XMLToReact from "@xdamman/xml-to-react";
import YouTubeEmbed from "../components/GoogleDoc/YouTubeEmbed";
import FacebookVideoEmbed from "../components/GoogleDoc/FacebookVideoEmbed";
import VimeoEmbed from "../components/GoogleDoc/VimeoEmbed";
import LoomEmbed from "../components/GoogleDoc/LoomEmbed";
import GoogleCalendar from "../components/GoogleDoc/GoogleCalendar";
import TwitterEmbed from "../components/GoogleDoc/TwitterEmbed";
import RevueEmbed from "../components/GoogleDoc/RevueEmbed";
import Button from "../components/Button";
import slugify from "slugify";
import { decode } from "html-entities";
import fs from "fs";

// build index by googleDocId for lookups
const googleDocIds = {};
const sitemap = {};
Object.keys(sitemap).forEach((hostKey) => {
  Object.keys(sitemap[hostKey].sitemap).forEach((path) => {
    const pageInfo = sitemap[hostKey].sitemap[path];
    pageInfo.slug = path;
    pageInfo.hosts = sitemap[hostKey].hosts;
    googleDocIds[pageInfo.googleDocId] = pageInfo;
  });
});

export function getPageMetadataByGoogleDocId(googleDocId) {
  return googleDocIds[googleDocId];
}

// Remove Google Redirect and turn links to other Google Docs to pages
// e.g. https://docs.google.com/document/d/1Nl9JsoDPHHGtoQAHWaY-7GAsrTur8XixemGZsIKb9Vs/edit#heading=h.xgnlbr1pklz4
// e.g. https://docs.google.com/document/u/0/d/1Nl9JsoDPHHGtoQAHWaY-7GAsrTur8XixemGZsIKb9Vs/edit#heading=h.xgnlbr1pklz4
// become internal links /1Nl9JsoDPHHGtoQAHWaY-7GAsrTur8XixemGZsIKb9Vs
function removeGoogleRedirect(href) {
  if (!href) return "";
  let linkUrl = decodeURIComponent(href)
    .replace("https://www.google.com/url?q=", "")
    .replace(/&amp;/g, "&")
    .replace(/&sa=D(&source=.+)?&ust=[0-9]+&usg=.{28}/, "");

  const matches = linkUrl.match(
    /https:\/\/docs.google.com\/document\/(?:u\/[0-9]\/)?d\/(.{44})/i
  );
  if (
    linkUrl.indexOf("docs.google.com/document/") !== -1 &&
    linkUrl.indexOf("/copy") === -1
  ) {
    const googleDocId = matches[1];
    const pageInfo = getPageMetadataByGoogleDocId(googleDocId) || {};
    linkUrl = `/${pageInfo.slug || matches[1]}`;
  }
  return linkUrl;
}

function cleanHTML(html) {
  // console.log(html);
  return (
    html
      // iframes
      .replace(
        /&lt;iframe ([^<]+)&gt;&lt;\/iframe&gt;/gi,
        (match, p1) => `<iframe ${p1.replace(/&quot;/gi, '"')} />`
      )
      // Youtube embeds
      .replace(
        /<a [^>]*>https?:\/\/(www\.)?(youtu.be\/|youtube.com\/(embed\/|watch\?v=))([a-z0-9_-]{11})[^<]*<\/a>/gi,
        (match, p1, p2, p3, p4) => `<YouTube id="${p4}" />`
      )
      // Vimeo embeds
      .replace(
        /<a [^>]*>https?:\/\/(www\.)?vimeo.com\/([0-9]+)[^<]*<\/a>/gi,
        (match, p1, p2, p3, p4) => `<Vimeo id="${p2}" />`
      )
      // Facebook video embeds
      // e.g. https://fb.watch/g7VLn9usDR/
      .replace(
        /<a [^>]*>(https?:\/\/fb.watch\/[^\/]+)[^<]*<\/a>/gi,
        (match, p1, p2, p3, p4) => `<FacebookVideo videoUrl="${p1}" />`
      )
      // e.g. https://www.facebook.com/watch/?v=1052376648744351
      .replace(
        /<a [^>]*>(https?:\/\/(www\.)?facebook.com\/watch\/?\?v=[0-9]+)[^<]*<\/a>/gi,
        (match, p1, p2, p3, p4) => `<FacebookVideo videoUrl="${p1}" />`
      )
      // e.g. https://www.facebook.com/100064854334398/videos/1052376648744351/
      .replace(
        /<a [^>]*>(https?:\/\/(www\.)?facebook.com\/[0-9]+\/videos\/[0-9]+)[^<]*<\/a>/gi,
        (match, p1, p2, p3, p4) => `<FacebookVideo videoUrl="${p1}" />`
      )
      // Loom embeds
      .replace(
        /<a [^>]*>https?:\/\/(www\.)?loom\.com\/(embed|share)\/([a-z0-9_-]{32})[^<]*<\/a>/gi,
        (match, p1, p2, p3, p4) => `<Loom id="${p3}" />`
      )
      // Google Calendar embeds
      .replace(
        /<a [^>]*>https?:\/\/calendar.google.com\/calendar\/u\/0\/embed\?ctz=([^&]+)&amp;src=([^"]+)[^<]*<\/a>/gi,
        (match, p1, p2, p3, p4) => `<GoogleCalendar ctz="${p1}" src="${p2}" />`
      )
      // Support for custom components
      // <ComponentName attr1="value1" attr2="value2" />
      .replace(
        />\&lt;(\S+) ([^<]+)\/?\&gt;</gi,
        (match, component, attributes) => {
          const params = {};
          const matches = attributes.matchAll(
            /(\S+)=["'???]?((?:.(?!["'???]?\s+(?:\S+)=|\s*\/?[>"'???]))+.)["'???]?/gi
          );
          [...matches].forEach((param) => {
            const attr = param[1];
            const value = param[2];
            params[attr] = value;
          });
          console.log(">>> component", component, "params", params);
          let component_str = "";
          if (component && component.toLowerCase() === "airtable") {
            component_str = `<airtable base="${params.base}" table="${params.table}" />`;
          }
          if (component && component.toLowerCase() === "balance") {
            component_str = `<balance chain="${params.chain}" address="${params.address}" token="${params.token}" />`;
          }
          return `>${component_str}<`;
        }
      )
      // Twitter embed
      .replace(
        /<a [^>]*>(https?:\/\/(www\.)?twitter.com\/(.){1,15}\/status(es)?\/([0-9]+)[^<]*)<\/a>/gi,
        (match, p1, p2, p3, p4, p5) => `<Twitter tweetUrl="${p1}" />`
      )
      // GetRevue newsletter embed
      .replace(
        /<a [^>]*>(https?:\/\/(www\.)?getrevue.co\/profile\/[^<]+)<\/a>/gi,
        (match, p1, p2, p3, p4) => {
          return `<Revue revueUrl="${p1}" />`;
        }
      )
      // Support for [[primary button]] and [secondary button]
      // <span>[</span><span><a href="">button</a></span><span>]</span>
      .replace(
        /<span[^>]*>\s*(\[+)\s*<\/span><span[^>]*><a( class="[^"]+")? href="([^"]+)"[^>]*>([^<]*)<\/a><\/span>(<span>\s*<\/span>)?<span[^>]*>\s*\]+\s*<\/span>/gim,
        (match, border, classes, href, label) => {
          return `<Button href="${removeGoogleRedirect(href)}" ${
            border.length == 2 ? 'primary="true"' : ""
          }>${label}</Button>`;
        }
      )
      // <a href="">[button]</a>
      .replace(
        /<a( class="[^"]+")? href="([^"]+)">\s*(\[+)\s*([^<]+)\s*\]+\s*<\/a>/gi,
        (match, classes, href, border, label) => {
          return `<Button href="${removeGoogleRedirect(href)}" ${
            border.length == 2 ? 'primary="true"' : ""
          }>${label}</Button>`;
        }
      )
      .replace(/<img ([^>]+)>/gi, "<img $1 />")
      .replace(/ (alt|title)=""/gi, "")
      .replace(/<hr style="page-break[^"]+">/gi, '<div class="pagebreak" />')
  );
}

function convertDomToReactTree(xml, classes, format) {
  if (!xml) {
    // console.log(">>> calling convertDomToReactTree with", `"${xml}"`, classes);
    throw new Error("No XML provided to convertDomToReactTree");
  }

  const $ = cheerio.load(xml, { xmlMode: true });

  function Image({
    children,
    i,
    src,
    width,
    height,
    className,
    containerStyle,
  }) {
    return (
      <span className={className} style={containerStyle}>
        <img
          // src={src}
          src={`/proxy/image?src=${encodeURIComponent(src)}`}
          width={width}
          height={height}
        />
      </span>
    );
  }

  function ImageConverter(attrs, data = {}) {
    const { children, i, src, style } = attrs;
    const size = style.match(/width: ([0-9]+).*height: ([0-9]+)/i);
    const parentStyle = $(`img[src="${src}"]`).parent().first().attr("style");
    const parentClass = $(`img[src="${src}"]`)
      .parent()
      .first()
      .parent()
      .first()
      .attr("class");
    const transform = parentStyle.match(/ transform: ([^;]+);/i);
    const margin = parentStyle.match(/ margin: ([^;]+);/i);
    const containerStyle = {
      display: "block",
      transform: transform[1],
      // margin: margin[1],
    };

    let parentClassStyles = classes[parentClass];
    // if the parent has more than one class, we need to merge the styles
    if (!parentClassStyles && parentClass && parentClass.match(/\s/)) {
      parentClassStyles = "";
      parentClass.split(" ").map((className) => {
        parentClassStyles += classes[className] + ";";
      });
    }
    const wrapperClasses = ["imageWrapper"];
    if (size[1] > 500) {
      containerStyle.textAlign = "center";
      wrapperClasses.push("fullWidth");
    } else {
      if (parentClassStyles && parentClassStyles.match(/text-align:center/)) {
        containerStyle.margin = "0 auto";
        containerStyle.textAlign = "center";
      }
      containerStyle.maxWidth = Math.round(size[1]);
    }
    let width = Math.round(size[1]);
    let height = Math.round(size[2]);
    const className = wrapperClasses.join(" ");

    // limit large images to max 640px for emails
    if (data.format === "email" && width > 600) {
      // height = (height / width) * 600;
      height = null;
      width = 600;
      containerStyle.display = "block";
      containerStyle.width = "600px";
      containerStyle.maxWidth = "100%";
    }

    data.images.push({ src, width, height, className, containerStyle });

    return {
      type: () =>
        Image({
          src,
          width,
          height,
          className,
          containerStyle,
        }),
      attrs,
    };
  }

  function Br({ children }) {
    return (
      <span>
        <br />
        {children}
      </span>
    );
  }

  function Hr({ children }) {
    return (
      <div>
        <hr />
        {children}
      </div>
    );
  }

  function Link({ children, href, className }) {
    if (!href) return null;
    let linkText = children,
      title = "";
    let newValue = removeGoogleRedirect(href);
    // console.log(">>> Link", href, "new value", newValue);

    // Limit display links to 40 chars (since they don't wrap)
    if (linkText.length > 40 && linkText.match(/^https?:\/\/[^ ]+$/)) {
      title = linkText;
      linkText = `${linkText
        .replace(/https?:\/\/(www\.)?/, "", "i")
        .substr(0, 39)}???`;
    }

    return (
      <span>
        <a href={newValue} className={className} title={title}>
          {linkText}
        </a>
      </span>
    );
  }

  const xmlToReact = new XMLToReact({
    html: () => ({ type: "html" }),
    body: () => ({ type: "body" }),
    // style: (attrs) => ({ type: "style", props: attrs }),
    div: (attrs) => ({ type: "div", props: { className: attrs.class } }),
    span: (attrs) => ({
      type: "span",
      props: { className: attrs.class },
    }),
    a: (attrs) => ({
      type: Link,
      props: { className: attrs.class, href: attrs.href },
    }),
    p: (attrs) => ({ type: "p", props: { className: attrs.class } }),
    br: (attrs) => ({ type: Br, props: { className: attrs.class } }),
    hr: (attrs) => ({ type: Hr, props: { className: attrs.class } }),
    h1: (attrs) => ({
      type: "h1",
      props: { className: attrs.class, id: attrs.id },
    }),
    h2: (attrs) => ({
      type: "h2",
      props: { className: attrs.class, id: attrs.id },
    }),
    h3: (attrs) => ({
      type: "h3",
      props: { className: attrs.class, id: attrs.id },
    }),
    h4: (attrs) => ({
      type: "h4",
      props: { className: attrs.class, id: attrs.id },
    }),
    h5: (attrs) => ({
      type: "h5",
      props: { className: attrs.class, id: attrs.id },
    }),
    ul: (attrs) => ({ type: "ul", props: { className: attrs.class } }),
    ol: (attrs) => ({ type: "ol", props: { className: attrs.class } }),
    li: (attrs) => ({ type: "li", props: { className: attrs.class } }),
    iframe: (attrs) => ({
      type: "iframe",
      props: {
        src: attrs.src,
        frameBorder: attrs.frameborder,
        scrolling: attrs.scrolling,
        // style: attrs.style, // The `style` prop expects a mapping from style properties to values, not a string. For example, style={{marginRight: spacing + 'em'}} when using JSX
        width: attrs.width,
        height: attrs.height,
      },
    }),
    table: (attrs) => ({ type: "table", props: { className: attrs.class } }),
    thead: (attrs) => ({ type: "thead", props: { className: attrs.class } }),
    tbody: (attrs) => ({ type: "tbody", props: { className: attrs.class } }),
    tr: (attrs) => ({ type: "tr", props: { className: attrs.class } }),
    td: (attrs) => ({
      type: "td",
      props: {
        className: attrs.class,
        rowSpan: attrs.rowspan,
        colSpan: attrs.colspan,
      },
    }),
    Button: (attrs) => ({
      type: Button,
      props: { label: attrs.label, href: attrs.href, primary: attrs.primary },
    }),
    YouTube: (attrs) => ({
      type: YouTubeEmbed,
      props: { id: attrs.id, format },
    }),
    FacebookVideo: (attrs) => ({
      type: FacebookVideoEmbed,
      props: { videoUrl: attrs.videoUrl },
    }),
    Vimeo: (attrs) => ({ type: VimeoEmbed, props: { id: attrs.id } }),
    Loom: (attrs) => ({ type: LoomEmbed, props: { id: attrs.id } }),
    GoogleCalendar: (attrs) => ({
      type: GoogleCalendar,
      props: { src: attrs.src, ctz: attrs.ctz },
    }),
    airtable: (attrs) => ({
      type: "airtable",
      props: { base: attrs.base, table: attrs.table },
    }),
    balance: (attrs) => ({
      type: "balance",
      props: { chain: attrs.chain, address: attrs.address, token: attrs.token },
    }),
    Twitter: (attrs) => ({
      type: TwitterEmbed,
      props: { tweetUrl: attrs.tweetUrl, format },
    }),
    Revue: (attrs) => ({
      type: RevueEmbed,
      props: { revueUrl: attrs.revueUrl },
    }),
    img: ImageConverter,
  });
  let reactTree;
  const data = { format, images: [] };
  try {
    reactTree = xmlToReact.convert(xml, data);
  } catch (e) {
    console.log("ERROR convert xmltoreact:", e);
  }
  return { reactTree, images: data.images };
}

const processHTML = (htmlText, format) => {
  if (htmlText.indexOf("#email-display") !== -1) {
    throw new Error("not_published");
  }
  const classes = {};
  const cleaned = cleanHTML(htmlText);
  // console.log(">>> cleaned", cleaned);
  const $ = cheerio.load(cleaned, { xmlMode: true });
  const styles = decode($("#contents style").html());
  // console.log(">>> styles", styles);
  styles.replace(/\.(c[0-9]+)\{([^\}]*)}/g, (match, className, css) => {
    classes[className] = css;
    return match;
  });

  const dismissedSelectors = [],
    replacedSelectors = [];
  function dismissSelector(selector) {
    dismissedSelectors.push(selector);
    return "";
  }
  function replaceSelector(selector, a, b) {
    replacedSelectors.push({ selector, a, b });
    return "";
  }
  const newStyles = styles.replace(
    /([^{]+){([^}]+)}/gi,
    (matches, selector, style) => {
      if (selector && selector.match(/\.c[0-9]+/)) {
        // return matches;

        // we ignore the styles that define the default value (sometimes there is no class associated to it, which creates discripencies)
        if (
          matches.match(
            /color:#000000;font-weight:400;(.*;)?font-size:11pt;(.*;)?font-style:normal/
          )
        )
          return dismissSelector(selector);

        if (matches.match(/orphans:2;widows:2;text-align:left/))
          return dismissSelector(selector);

        // if (matches.match(/orphans:2;widows:2;text-align:center/))
        //   return replaceSelector(selector, '<div class="center">', "</div>");

        // console.log(">>> matches", matches);

        return matches
          .replace(/font-family:[^;}]+;?/gi, "")
          .replace(/line-height:[^;}]+;?/gi, "")
          .replace(
            /(margin|padding)(-(top|right|bottom|left))?:[^};]+\;?/gi,
            ""
          );
      } else return dismissSelector(selector);
    }
  );

  const classesToReplace = replacedSelectors
    .filter((n) => !n.selector.match(/:/) && n.selector.match(/\./))
    .map((s) => {
      return {
        selector: s.selector.substring(s.selector.indexOf(".") + 1),
        a: s.a,
        b: s.b,
      };
    });

  if (classesToReplace.length > 0) {
    $(`.${classesToReplace.map((s) => s.selector).join(", .")}`).each(
      (i, e) => {
        const classes = $(e).attr("class").split(" ");
        classes.forEach((cl) => {
          if (classesToReplace.map((s) => s.selector).indexOf(cl) !== -1) {
            const selector = classesToReplace.find((s) => s.selector === cl);
            const newTag = `${selector.a}${$(e).html()}${selector.b}`;
            console.log("Replacing", e.tagName, classes, "with", newTag);
            $(e).replaceWith(newTag);
          }
        });
      }
    );
  }

  const classesToRemove = dismissedSelectors
    .filter((n) => !n.match(/:/) && n.match(/\./))
    .map((c) => c.substring(c.indexOf(".") + 1));

  if (classesToRemove.length > 0) {
    $(`.${classesToRemove.join(", .")}`).each((i, e) => {
      const classes = $(e).attr("class").split(" ");
      classes.forEach((cl) => {
        if (classesToRemove.indexOf(cl) !== -1) {
          $(e).removeClass(cl);
        }
      });
    });
  }

  // // unwrap image wrappers
  // console.log(">>> unwrap image wrappers", $("img").length);
  // $("img").each((i, e) => {
  //   console.log(
  //     ">>> img",
  //     $(e).attr("src").substr(34, 40),
  //     $(e)
  //       .parent()
  //       .first()
  //       .parent()
  //       .first()
  //       .parent()
  //       .first()
  //       .html()
  //       .substr(0, 60)
  //   );
  // });

  let title = null,
    description = null;
  $("h1,h2,p").each((i, e) => {
    if (["h1", "h2"].includes(e.name)) {
      const text = $(e).text();
      if (text && !title) {
        title = text;
        if (format === "email") {
          $(e).remove();
        }
      }
    } else if (title && !description) {
      description = $(e).text();
    }
  });

  let outline = [];
  $("h1, h2, h3, h4, h5, h6").each((i, e) => {
    const level = Number(e.name.substr(1)) - 1;
    const title = $(e).text();
    if (!title) return;
    const slug = slugify(title).toLowerCase();
    outline.push({ level, title, slug });
    $(e).attr("id", slug);

    // console.log(
    //   ">>> title",
    //   level,
    //   e.name,
    //   typeof e.children,
    //   "text:",
    //   $(e).text()
    // );
  });

  $("#contents > div").removeClass(); // remove the first container that has a max-width
  let xml = $("<div />").append($("#contents > div")).html();
  xml = xml
    .replace(/ class=""/g, "")
    .replace(/<span\/>/gm, "")
    .replace(/<div>/, '<div class="GoogleDoc content">');
  // console.log(">>> xml", xml.substr(0, 512));
  const { reactTree, images } = convertDomToReactTree(xml, classes, format);
  try {
    const body = `<style>${newStyles}</style>${renderToString(reactTree)}`;
    return { title, description, outline, body, images };
  } catch (e) {
    console.log("!!! processHTML > renderToString error", e);
  }
};

/**
 *
 * @param {*} docid
 * @param {*} format email or webpage (default)
 * @returns
 */
export async function getHTMLFromGoogleDocId(docid, format) {
  if (docid.length !== 44) {
    throw new Error("invalid_googledocid");
  }
  const googledoc = `https://docs.google.com/document/d/${docid}`;
  let res;
  try {
    console.log(">>> loading google doc", googledoc);
    res = await fetch(`${googledoc}/pub`);
    if (res.status !== 200) {
      throw new Error(`${res.status} ${res.statusText}`);
    }
  } catch (e) {
    console.log("!!! getHTMLFromGoogleDocId > fetch error", e);
  }

  const htmlText = await res.text();
  if (
    htmlText.match("This document is not published") ||
    htmlText.match(/<form action="\/v[0-9]\/signin\//gi)
  ) {
    throw new Error("not_published");
  }
  const doc = processHTML(htmlText, format);

  // writing the file to cache so that tailwind can detect the class names used
  const cacheFilename = `.cache/tmp/${docid}.html`;
  try {
    fs.writeFileSync(cacheFilename, doc.body);
    console.log(">>> writing to local cache", cacheFilename);
  } catch (e) {
    console.error("Error writing to local cache", cacheFilename, e);
  }
  return doc;
}
