const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { v4: uuidv4 } = require('uuid');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');
const ytdlp = require('yt-dlp-exec');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const FormData = require('form-data');
const axios = require('axios');
const leoProfanity = require('leo-profanity');

ffmpeg.setFfmpegPath(ffmpegPath);

const app = express();
const port = 3000;

require('dotenv').config();

app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

const cachedResults = {};

const downloadsDir = path.join(__dirname, 'downloads');
if (!fs.existsSync(downloadsDir)) {
  fs.mkdirSync(downloadsDir);
}
//main shit
async function uploadToAssemblyAI(audioPath) {
  const form = new FormData();
  form.append('file', fs.createReadStream(audioPath));
//send the audio file to the assembly ai
  const response = await axios.post(
    'https://api.assemblyai.com/v2/upload',
    form,
    {
      headers: {
        authorization: process.env.ASSEMBLYAI_API_KEY,
        ...form.getHeaders()
      },
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
    }
  );
  console.log("Upload_url came in response");
  return response.data.upload_url;
}
//send the upload URL to assembly to get the transcript
async function transcribeWithAssemblyAI(audioUrl) {
  const response = await axios.post(
    'https://api.assemblyai.com/v2/transcript',
    {
      audio_url: audioUrl
    },
    {
      headers: {
        authorization: process.env.ASSEMBLYAI_API_KEY,
        'Content-Type': 'application/json'
      }
    }
  );

  const transcriptId = response.data.id;
  console.log("transcriptId came in response");

  let transcriptStatus = 'queued';
  let transcriptResult;

  while (transcriptStatus !== 'completed') {
    await new Promise(res => setTimeout(res, 5000));

    const pollingResponse = await axios.get(
      `https://api.assemblyai.com/v2/transcript/${transcriptId}`,
      {
        headers: { authorization: process.env.ASSEMBLYAI_API_KEY }
      }
    );

    transcriptStatus = pollingResponse.data.status;
    transcriptResult = pollingResponse.data;
  }
  console.log("transcript text came in response");
  return transcriptResult.text;
}

app.post('/api/analyze', async (req, res) => {
  const startTime = Date.now(); // ⏱️ Start timer

  const { url } = req.body;
  if (!url) return res.status(400).json({ error: 'No URL provided' });

  const id = uuidv4();
  const outputAudio = path.join(downloadsDir, `${id}.mp3`);

  //This block of code is for video downloading
  // const outputVideo = path.join(downloadsDir, `${id}.mp4`);
  try {
    // await ytdlp(url, {
    //   output: outputVideo,
    //   format: 'mp4',
    //   quiet: true,
    //   ffmpegLocation: ffmpegPath
    // });
    
  //This block of code is for audio download
    await ytdlp(url, {
      output: outputAudio,
      extractAudio: true,
      audioFormat: 'mp3',
      quiet: true,
      ffmpegLocation: ffmpegPath
    });
    console.log("audio has been downloaded from yt-dlp");

    const audioUrl = await uploadToAssemblyAI(outputAudio);

    const transcript = await transcribeWithAssemblyAI(audioUrl);
    //splits every word
    const words = transcript.split(/\s+/);
    //checks every word for vulgarity 
    const totalVulgar = words.filter(word => leoProfanity.check(word)).length;
    console.log("total vulgar words have been counted: ", totalVulgar);

    const result = {
      id,
      transcript,
      totalVulgarWords: totalVulgar,
    };
    const elapsedTime = ((Date.now() - startTime) / 1000).toFixed(2); // ⏱️ End timer

    cachedResults[id] = result;
    //sends response to results.html
    res.json({ id });

    console.log("---process took:", elapsedTime, "sec---");

    setTimeout(() => {
      delete cachedResults[id];
      if (fs.existsSync(outputAudio)) fs.unlinkSync(outputAudio);
      // if (fs.existsSync(outputVideo)) fs.unlinkSync(outputVideo);
    }, 10 * 60 * 1000);

  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ error: 'Analysis failed' });
  }
});

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, downloadsDir),
  filename: (req, file, cb) => {
    const id = uuidv4();
    file._id = id; // Save the ID on the file object for later access
    cb(null, id + path.extname(file.originalname)); // <uuid>.mp3
  }
});

const upload = multer({ storage });

app.post('/api/upload-audio', upload.single('audio'), async (req, res) => {

  const startTime = Date.now(); // ⏱️ Start timer

  const id = req.file._id; // retrieve uuid from the file object
  const uploadedPath = req.file.path;
  console.log("multer has saved the file and gave id and path");
  try {
    const audioUrl = await uploadToAssemblyAI(uploadedPath);
    const transcript = await transcribeWithAssemblyAI(audioUrl);

    const words = transcript.split(/\s+/);
    const totalVulgar = words.filter(word => leoProfanity.check(word)).length;

    const result = {
      id,
      transcript,
      totalVulgarWords: totalVulgar,
    };

    const elapsedTime = ((Date.now() - startTime) / 1000).toFixed(2); // ⏱️ End timer

    cachedResults[id] = result;
    res.json({ id });

    console.log("---process took:", elapsedTime, "sec---");

    setTimeout(() => {
      delete cachedResults[id];
      if (fs.existsSync(uploadedPath)) fs.unlinkSync(uploadedPath);
    }, 10 * 60 * 1000);

  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ error: 'Analysis failed' });
  }
});


app.get('/api/result/:id', (req, res) => {
  const result = cachedResults[req.params.id];
  if (result) {
    res.json(result);
  } else {
    res.status(404).json({ error: 'Result not found' });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
