import { Link } from "@remix-run/react";
import type { LoaderArgs } from "@remix-run/node"

export default function Footer({groups, params} : { groups, params: LoaderArgs }) {
  console.log(">>> Footer: params", params)

  if (!groups) {
    return <></>;
  }
  const activeGroup = groups.find(l => l.slug === params.group);

  function FooterLink({slug, title, className } : {slug: string, title: string, className: string}) {
    return (
      <Link to={`/${params.domain}/${slug}`} className={className}>{title}</Link>
    )
  }

  return (

    <footer className="p-4 bg-white rounded-lg shadow md:flex md:items-center md:justify-between md:p-6 dark:bg-gray-800">
    <span className="text-sm text-gray-500 sm:text-center dark:text-gray-400">
      🔅 2022 <a href={`/${params.domain}`} className="hover:underline">{groups[0].title}</a>. All Contributions Welcome.
      { activeGroup?.googleDocId && (<span> (
          <a
            href={`https://docs.google.com/document/d/${activeGroup.googleDocId}/edit`}
            target="_blank"
            rel="noreferrer"
            className="text-gray-400 text-sm hover:underline"
            >
          Suggest Edits 📝
        </a>)</span>
      )}
    </span>
    <ul className="flex flex-wrap items-center mt-3 text-sm text-gray-500 dark:text-gray-400 sm:mt-0">
      { groups.slice(1).map((group, i) => (
        <li className="list-none" key={i}>
            <FooterLink slug={group.slug} title={group.title} className="mr-4 hover:underline md:mr-6 " />
        </li>
          ))}
    </ul>
    </footer>
  )
}