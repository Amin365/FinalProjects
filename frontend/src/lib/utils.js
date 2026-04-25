import { clsx } from "clsx";
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function extractArrayPayload(value) {
  if (Array.isArray(value)) return value;
  if (!value || typeof value !== "object") return [];

  const directKeys = [
    "data",
    "items",
    "results",
    "rows",
    "docs",
    "list",
    "achievements",
    "goals",
    "challenges",
    "events",
    "readers",
    "books",
  ];

  for (const key of directKeys) {
    if (Array.isArray(value[key])) return value[key];
  }

  for (const key of directKeys) {
    if (value[key] && typeof value[key] === "object") {
      const nested = extractArrayPayload(value[key]);
      if (nested.length > 0) return nested;
    }
  }

  return [];
}
