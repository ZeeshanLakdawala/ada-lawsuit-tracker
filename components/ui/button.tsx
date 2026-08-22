import * as React from "react";
import { cn } from "@/lib/utils";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "outline";
};

export function Button({ className, variant = "default", ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex h-10 items-center justify-center gap-2 rounded-md px-4 text-sm font-semibold transition-colors disabled:pointer-events-none disabled:opacity-50",
        variant === "default" && "bg-teal-700 text-white hover:bg-teal-800",
        variant === "outline" && "border border-stone-300 bg-white text-stone-900 hover:bg-stone-100",
        className
      )}
      {...props}
    />
  );
}

export function buttonClasses(variant: "default" | "outline" = "default", className?: string) {
  return cn(
    "inline-flex h-10 items-center justify-center gap-2 rounded-md px-4 text-sm font-semibold transition-colors aria-disabled:pointer-events-none aria-disabled:opacity-50",
    variant === "default" && "bg-teal-700 text-white hover:bg-teal-800",
    variant === "outline" && "border border-stone-300 bg-white text-stone-900 hover:bg-stone-100",
    className
  );
}
