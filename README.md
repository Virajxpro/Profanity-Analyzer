# 🚨 Profanity Analyzer 🎧📉

**Profanity Analyzer** is an AI-powered tool that detects and visualizes **vulgar or inappropriate content** in YouTube videos and audio files. Whether you're a parent, educator, content reviewer, or just a curious viewer — this project helps you **analyze the safety** of media before sharing or using it. 🧠📺

---

## 🔍 What It Does

1. 🎥 **Supports both YouTube videos and audio files** – paste a link and let the analyzer do its magic.
2. 📥 **Downloads media** using [`yt-dlp`](https://github.com/yt-dlp/yt-dlp).
3. 🗣️ **Transcribes audio to text** using **AssemblyAI** – the very accurate speech-to-text engine.
4. 🤬 **Scans the transcript** with `leo-profanity` to detect vulgar words.
5. 📊 **Visualizes vulgar segments** with **Chart.js** – so you know *how much* profanity exists.
6. 📈 Gives you a **"Vulgarity Ratio"**, total count of offensive words.

---

💡 Use Cases
1. 🧒 Parental Control: Check if a video is safe for children.
2. 🎓 Educational Use: Filter videos for classroom safety.
3. 🧑‍💼 Content Moderation: Automate profanity detection in user-generated content.
4. 🎥 YouTube Creators: Audit your own videos for monetization compliance.

---

🛠️ Tech Stack
* Frontend: HTML, CSS, JavaScript, Chart.js 📊
* Backend: Node.js, Express.js 🚀
* AI/ML: AssemblyAI 🧠
* Profanity Filter: leo-profanity 💬
* Media Handling: yt-dlp 🎞️

---

🚀 Try it Out
Just clone the repo, install dependencies, and you're ready to scan!
``` 
git clone https://github.com/your-username/profanity-analyzer.git
cd profanity-analyzer
npm install
node server.js 
```
