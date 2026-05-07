import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatEuro(value: number) {
  return new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR"
  }).format(value);
}

export function formatPercent(value: number) {
  return `${Math.round(value)}%`;
}

export function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .map((part) => part.at(0))
    .join("")
    .slice(0, 2)
    .toUpperCase();
}
