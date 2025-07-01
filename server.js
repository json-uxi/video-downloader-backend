const express = require('express');
const cors = require('cors');
const { exec } = require('child_process');
const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.post('/api/download', (req, res) => {
    const videoUrl = req.body.url;

    if (!videoUrl) {
        return res.status(400).json({ error: 'No URL provided' });
    }

    const cmd = `yt-dlp -j "${videoUrl}"`;

    exec(cmd, (error, stdout, stderr) => {
        if (error) {
            console.error(`Error: ${error.message}`);
            return res.status(500).json({ error: 'Download failed. Invalid or unsupported URL.' });
        }

        try {
            const info = JSON.parse(stdout);
            const formats = info.formats
                .filter(f => f.ext === 'mp4' && f.url)
                .map(f => ({
                    quality: f.format_note || f.height + 'p',
                    format: f.ext,
                    url: f.url
                }));

            const bestThumbnail = info.thumbnails?.[info.thumbnails.length - 1]?.url || '';

            return res.json({
                title: info.title,
                thumbnail: bestThumbnail,
                duration: info.duration_string || (info.duration + ' sec'),
                quality: formats[0]?.quality || 'HD',
                downloadLinks: formats.slice(0, 3)
            });
        } catch (e) {
            console.error('Failed to parse output', e);
            return res.status(500).json({ error: 'Unexpected error parsing video info' });
        }
    });
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
