import type { ReactNode } from "react";
import { PageHeader } from "@/components/common/page-header";

export function AdminPage({
  title,
  description,
  actions,
  children,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="mx-auto w-full max-w-[1400px] px-4 py-6 sm:px-6 lg:px-8">
      <PageHeader title={title} description={description} actions={actions} />
      <div className="space-y-6">{children}</div>
    </div>
  );
}
