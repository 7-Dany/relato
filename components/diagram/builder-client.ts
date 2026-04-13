"use client";

import dynamic from "next/dynamic";

export const DiagramBuilderClient = dynamic(
  () => import("@/components/diagram/builder").then((m) => m.DiagramBuilder),
  { ssr: false },
);
