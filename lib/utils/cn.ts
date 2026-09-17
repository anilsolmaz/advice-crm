// lib/utils/cn.ts
// Tailwind class merger — lightweight alternative to clsx+twMerge for this project.
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
