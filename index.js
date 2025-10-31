const functions = require("firebase-functions");
const admin = require("firebase-admin");
const ytdl = require("ytdl-core");
const {v4: uuidv4} = require("uuid");
const stream = require("stream");

admin.initializeApp();

// Cloud Function: Fetch YouTube audio and upload to Firebase Storage
exports.fetchYouTubeAudio = functions
    .runWith({memory: "1GB", timeoutSeconds: 300})
    .https.onCall(async (data, context) => {
      try {
        const {youtubeUrl} = data;

        if (!context.auth) {
          throw new functions.https.HttpsError(
              "unauthenticated",
              "User must be authenticated.",
          );
        }

        if (!ytdl.validateURL(youtubeUrl)) {
          throw new functions.https.HttpsError(
              "invalid-argument",
              "Invalid YouTube URL.",
          );
        }

        const info = await ytdl.getInfo(youtubeUrl);
        const title = info.videoDetails.title.replace(/[^\w\s]/gi, "_");
        const bucket = admin.storage().bucket();
        const filePath = `music/${context.auth.uid}/${title}_${uuidv4()}.mp3`;

        // Stream audio from YouTube to Firebase Storage
        const passThrough = new stream.PassThrough();
        const writeStream = bucket.file(filePath).createWriteStream({
          metadata: {
            contentType: "audio/mpeg",
            metadata: {
              firebaseStorageDownloadTokens: uuidv4(),
            },
          },
        });

        const downloadStream = ytdl(youtubeUrl, {filter: "audioonly", quality: "highestaudio"});
        downloadStream.pipe(passThrough).pipe(writeStream);

        await new Promise((resolve, reject) => {
          writeStream.on("finish", resolve);
          writeStream.on("error", reject);
        });

        const file = bucket.file(filePath);
        const [url] = await file.getSignedUrl({
          action: "read",
          expires: "03-09-2491",
        });

        return {
          title,
          storagePath: filePath,
          downloadUrl: url,
        };
      } catch (error) {
        console.error("Error fetching YouTube audio:", error);
        throw new functions.https.HttpsError("internal", error.message);
      }
    });
