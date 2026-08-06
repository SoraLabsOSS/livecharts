import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@workspace/ui/components/ui/avatar";
import type { BaseLayoutProps } from "fumadocs-ui/layouts/shared";
import { appName, gitConfig } from "./shared";

export function baseOptions(): BaseLayoutProps {
  return {
    githubUrl: `https://github.com/${gitConfig.user}/${gitConfig.repo}`,
    nav: {
      title: (
        <>
          <Avatar size="sm">
            <AvatarImage alt="" src="/logo.jpg" />
            <AvatarFallback>LC</AvatarFallback>
          </Avatar>
          {appName}
        </>
      ),
    },
  };
}
