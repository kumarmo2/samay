/**
 * Returns the parent directory of a given absolute path.
 * Preserves root "/", trims trailing slashes, works in browser.
 *
 * Examples:
 *  - "/"             → "/"
 *  - "/srv"          → "/"
 *  - "/srv/"         → "/"
 *  - "/srv/home"     → "/srv"
 */
export const goUpAdirectory = (absoluteFilePath: string): string => {
    const trimmed = absoluteFilePath.replace(/\/+$/, ""); // remove trailing slashes (but not root "/")
    if (trimmed === "") return "/";

    const parts = trimmed.split("/");

    if (parts.length <= 2) return "/"; // e.g., "/", "/srv"

    parts.pop(); // remove last part
    return parts.join("/");
};
