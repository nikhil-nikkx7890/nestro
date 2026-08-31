// Monetary values are stored as integer minor units, paise for INR (ADR-023).
// Formatting to a human-readable amount only ever happens here, at the
// presentation layer.
export function formatPaise(paise) {
    return `₹${(paise / 100).toLocaleString("en-IN")}`;
}

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