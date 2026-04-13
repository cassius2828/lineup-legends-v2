import type { ReactNode } from "react";

type AdminPageHeaderProps = {
  title: ReactNode;
  description: string;
  /** Optional action elements (buttons, links) rendered opposite the title */
  actions?: ReactNode;
};

export function AdminPageHeader({
  title,
  description,
  actions,
}: AdminPageHeaderProps) {
  return (
    <div className="mb-8">
      {actions ? (
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-foreground text-3xl font-bold">{title}</h1>
            <p className="text-foreground/50 mt-1">{description}</p>
          </div>
          {actions}
        </div>
      ) : (
        <>
          <h1 className="text-foreground text-3xl font-bold">{title}</h1>
          <p className="text-foreground/50 mt-1">{description}</p>
        </>
      )}
    </div>
  );
}
