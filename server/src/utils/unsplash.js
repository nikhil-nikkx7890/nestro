const UNSPLASH_SEARCH_URL = "https://api.unsplash.com/search/photos";

/**
 * Searches Unsplash for `count` real photos matching `query`. Used by
 * seedCatalog.js to source category photography dynamically instead of
 * hand-curating dozens of hard-coded URLs (which can't be verified without
 * opening each one, and silently break the seed if a photo is ever taken
 * down). Returns the `raw` URL (no size params baked in — callers append
 * their own via a query string, same pattern as seedProductImages.js).
 *
 * @param {string} query
 * @param {number} count
 * @returns {Promise<{ rawUrl: string, downloadLocation: string }[]>}
 */
export const searchUnsplashPhotos = async (query, count = 12) => {
  const accessKey = process.env.UNSPLASH_ACCESS_KEY;
  if (!accessKey) {
    throw new Error(
      "UNSPLASH_ACCESS_KEY is not set. Get a free key at unsplash.com/developers and add it to server/.env",
    );
  }

  const url = new URL(UNSPLASH_SEARCH_URL);
  url.searchParams.set("query", query);
  url.searchParams.set("per_page", String(count));
  url.searchParams.set("orientation", "landscape");
  url.searchParams.set("content_filter", "high");

  const response = await fetch(url, {
    headers: {
      Authorization: `Client-ID ${accessKey}`,
      "Accept-Version": "v1",
    },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Unsplash search failed for "${query}" (${response.status}): ${body}`);
  }

  const data = await response.json();

  return data.results.map((photo) => ({
    rawUrl: photo.urls.raw,
  }));
};

// Note: Unsplash's guidelines also ask for a download-tracking ping per
// photo actually used (photo.links.download_location). Deliberately not
// done here — each ping is its own API call and counts against the same
// hourly rate limit as the search calls, which mattered a lot more at
// this script's call volume (300 photos) than photographer analytics do
// for a local learning project.
