import type { DataMode } from "@/lib/data-mode";

export function selectAdapter<T>(mode: DataMode, mock: T, api: T): T {
  return mode === "api" ? api : mock;
}
