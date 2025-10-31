import ytdl from "ytdl-core";

export default async function handler(req, res) {
  try {
    const { url } = req.query;
    if (!url || !ytdl.validateURL(url)) {
      return res.status(400).json({ error: "Invalid YouTube URL" });
    }

    const info = await ytdl.getInfo(url);
    const format = ytdl.chooseFormat(info.formats, { quality: "highestaudio" });

    return res.status(200).json({
      audioUrl: format.url,
      title: info.videoDetails.title,
      author: info.videoDetails.author.name,
    });
  } catch (error) {
    console.error("Error fetching audio:", error);
    return res.status(500).json({ error: "Failed to fetch YouTube audio" });
  }
}
