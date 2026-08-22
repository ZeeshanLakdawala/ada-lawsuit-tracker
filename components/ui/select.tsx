import * as React from "react";
import { cn } from "@/lib/utils";

export function Select({ className, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "h-10 min-w-40 rounded-md border border-stone-300 bg-white px-3 text-sm text-stone-900",
        className
      )}
      {...props}
    />
  );
}
