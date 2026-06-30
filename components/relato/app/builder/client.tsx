"use client"

import dynamic from "next/dynamic"

export const RelatoBuilderClient = dynamic(
  () => import("./index").then((module) => ({ default: module.RelatoBuilder })),
  { ssr: false }
)
