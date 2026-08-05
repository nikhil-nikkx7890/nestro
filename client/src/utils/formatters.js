export function toTitleCase(text) {
    if (!text) return "";

    return text
        .trim()
        .toLowerCase()
        .split(/\s+/)
        .map(
            (word) => word.charAt(0).toUpperCase() + word.slice(1)
        )
        .join(" ");
}