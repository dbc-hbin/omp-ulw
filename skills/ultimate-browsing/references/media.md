# Media, subtitles and podcasts

Prefer an official transcript, caption link or feed enclosure already exposed by the source. Native `read` can read reachable text/VTT/SRT files; it does not transcribe audio. Preserve video/episode ID, creator, language, subtitle origin, publication time and source URL. Captions may be automated, mistranscribed, translated or incomplete.

## Optional installed yt-dlp

Check `command -v yt-dlp`; if absent, check `python3 -m yt_dlp --version` for an existing module and use that command form. If neither exists, state the prerequisite; do not install. Extractor support changes with the installed version and platform policy. Upstream's "1,858 sites" and success percentages were historical claims.

These concrete public examples can be replaced with the actual requested URL:

```bash
yt-dlp --dump-json "https://www.youtube.com/watch?v=BaW_jenozKc"
yt-dlp --list-subs "https://www.youtube.com/watch?v=BaW_jenozKc"
yt-dlp --write-sub --write-auto-sub --sub-lang "en,ko,zh-Hans,zh" --skip-download -o "/tmp/%(id)s" "https://www.youtube.com/watch?v=BaW_jenozKc"
yt-dlp --flat-playlist --dump-json "https://www.youtube.com/@YouTube/videos"
yt-dlp --dump-json "ytsearch5:battery recycling"
```

Read the reported output files with native `read`; use a task-owned output directory when collisions or sensitive content matter. Preserve caption timecodes. Remove rolling automatic-caption overlap for summaries without inventing missing words; retain the original file for quotations. `--convert-subs vtt` additionally requires an installed compatible ffmpeg.

Optional bounded YouTube comments:

```bash
yt-dlp --write-comments --skip-download --write-info-json --extractor-args "youtube:max_comments=20" -o "/tmp/%(id)s" "https://www.youtube.com/watch?v=BaW_jenozKc"
```

Read the `.info.json` comments field. This is best effort scraping, not proof of complete comments or a YouTube Data API export. `--dump-json` and subtitle commands avoid video download, but still make network requests and can expose private metadata in output if misused.

## Platform territories

- YouTube, Vimeo and Dailymotion may expose subtitles; other extractors return captions only if the source supplies them. Twitch VOD/clips, TikTok public posts, Rumble and PeerTube support varies.
- Audio metadata may be available for SoundCloud, Apple Podcasts, TuneIn, acast, Spreaker and Audius. Optional search prefixes documented upstream include `scsearch5:`, `dailymotionsearch5:` and `yahoosearch5:`; confirm installed extractor support before relying on them.
- Korean sources include Naver TV/live, Kakao, SBS, JTBC/programs, Chzzk, Soop, Daum clips and Weverse. Use the actual public URL with metadata extraction rather than hardcoding extractor availability. For news VOD (BBC, ABC iview, CBS, NBC), the publisher's official YouTube channel can be a separately attributed alternative.
- Bilibili uses the same metadata/subtitle commands on an actual `https://www.bilibili.com/video/...` URL. Public captions may be absent. An already installed and acceptably authenticated `bili` can use `bili search "battery" --type video -n 5`, `bili hot -n 10`, `bili rank -n 10`. QR login is a user-mediated account setup step only when authorized. Do not use cookie-import options.
- Douyin metadata, download links and text extraction were external service channels upstream. They are not native methods; see [social channels](social.md).

## Podcasts and Xiaoyuzhou

Read the episode page and RSS feed for publisher transcripts or linked text. Episode audio is not automatically a transcript.

The upstream optional command was:

```bash
agent-reach run xiaoyuzhou transcribe "https://www.xiaoyuzhoufm.com/episode/EPISODE_ID"
```

`EPISODE_ID` must come from the actual requested episode. This command is usable only if a compatible `agent-reach` Xiaoyuzhou channel, ffmpeg and an authorized configured transcription provider/key already exist. `agent-reach doctor` can inspect an existing installation. The upstream route used Groq and wrote Markdown under `/tmp`; inspect actual returned paths. Do not run pack installers, create a provider subscription, configure secrets in argv or assume free usage. Sending audio to a transcription service needs applicable permission, including for paid processing and private audio.

Without the channel/provider, native OMP has no promised equivalent speech-to-text or watermark-removal API. Report the gap and use available publisher transcripts. Never bypass DRM, account entitlement or region restrictions, or silently copy the user's browser cookies into a media utility.
