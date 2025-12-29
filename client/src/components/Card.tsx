import type React from "react";
import clsx from "clsx";

export default function Card({
  children,
  className
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={clsx("card p-5", className)}>{children}</div>;
}
