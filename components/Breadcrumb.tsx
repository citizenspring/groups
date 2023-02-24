import { Breadcrumb } from "flowbite-react";
import { HiHome } from "react-icons/hi";

function CustomBreadcrumb({domain, group, thread }: { domain: string, group: string, thread?: string}): JSX.Element {
  return (
    <Breadcrumb aria-label="Default breadcrumb example">
      <Breadcrumb.Item href={`/${domain}`} icon={HiHome}>
        {domain}
      </Breadcrumb.Item>
      <Breadcrumb.Item href={`/${domain}/${group}`}>{group}</Breadcrumb.Item>
      {thread && <Breadcrumb.Item>{thread}</Breadcrumb.Item>}
    </Breadcrumb>
  );
}

export default CustomBreadcrumb;