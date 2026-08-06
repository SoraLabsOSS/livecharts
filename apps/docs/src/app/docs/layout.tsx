import { DocsLayout } from "fumadocs-ui/layouts/docs";
import { ReactLogo } from "@/components/icons/react-logo";
import { VueLogo } from "@/components/icons/vue-logo";
import { baseOptions } from "@/lib/layout.shared";
import { source } from "@/lib/source";

export default function Layout({ children }: LayoutProps<"/docs">) {
  return (
    <DocsLayout
      tree={source.getPageTree()}
      {...baseOptions()}
      tabs={{
        transform: (option, node) => {
          const name =
            typeof node.name === "string" ? node.name.toLowerCase() : "";
          const icon =
            name === "react" ? (
              <ReactLogo className="size-4" />
            ) : name === "vue" ? (
              <VueLogo className="size-4" />
            ) : (
              option.icon
            );

          return { ...option, icon };
        },
      }}
    >
      {children}
    </DocsLayout>
  );
}
