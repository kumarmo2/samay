import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

export function isDigit(char: string) {
    const code = char.charCodeAt(0);
    return code >= 48 && code <= 57; // '0' to '9'
}
