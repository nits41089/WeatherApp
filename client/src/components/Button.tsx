import type React from "react";
import clsx from "clsx";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
}

export default function Button({
  variant = "primary",
  className,
  ...props
}: ButtonProps) {
  const base =
    "focus-ring inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-semibold transition";
  const variants = {
    primary: "bg-brand-500 text-white hover:bg-brand-600",
    secondary: "bg-slate-100 text-slate-900 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-100",
    ghost: "bg-transparent text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800",
    danger: "bg-rose-500 text-white hover:bg-rose-600"
  };
  return <button className={clsx(base, variants[variant], className)} {...props} />;
}
