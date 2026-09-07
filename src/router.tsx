import { createHashHistory, createRouter } from "@tanstack/react-router";
import { AppErrorComponent } from "@/lib/error-component";
import { routeTree } from "./routeTree.gen";

export function getRouter() {
  const onPages =
    typeof window !== "undefined" && window.location.pathname.startsWith("/lineburst");
  return createRouter({
    routeTree,
    defaultErrorComponent: AppErrorComponent,
    ...(onPages ? { history: createHashHistory() } : {}),
  });
}