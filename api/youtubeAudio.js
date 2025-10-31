export default async function handler(req, res) {
  try {
    const { url } = req.query;
    if (!url || !url.includes("youtube.com")) {
      return res.status(400).json({ error: "Invalid YouTube URL" });
    }

    // Use a safe YouTube API endpoint (no scraping)
    const api = `https://noembed.com/embed?url=${encodeURIComponent(url)}`;
    const response = await fetch(api);
    const data = await response.json();

    if (!data.title) {
      return res.status(500).json({ error: "Failed to retrieve metadata" });
    }

    // This will return metadata instead of blocked audio streams
    return res.status(200).json({
      title: data.title,
      author: data.author_name,
      thumbnail: data.thumbnail_url,
      audioUrl: url, // send original YouTube URL to open in player
    });
  } catch (error) {
    console.error("Error fetching video info:", error);
    return res.status(500).json({ error: "Failed to fetch YouTube info" });
  }
}
