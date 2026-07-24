import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_admin/" as never)({
  beforeLoad: () => {
    throw redirect({ to: "/admin/dashboard" as never });
  },
});
