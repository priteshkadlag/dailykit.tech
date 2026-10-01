import { VideoBitrateCalculator } from "@/components/creator/creator-tools";
import type { Faq } from "@/components/shared/faq-section";
import { ToolPage } from "@/components/shared/tool-page";
import { toolMetadata } from "@/lib/seo";

const slug = "video-bitrate-calculator";
const description = "Find the video bitrate to set in OBS for Twitch or YouTube Live, based on your upload speed, resolution and frame rate — with audio, keyframe and CBR settings.";

export const metadata = toolMetadata(slug, { title: "Video Bitrate Calculator for OBS – Twitch & YouTube Streaming", description });

const faqs: Faq[] = [
  { question: "What bitrate should I use for 1080p 60fps?", answer: "Twitch recommends about 6,000 Kbps for 1080p at 60 fps, which is also its standard ingest limit. YouTube Live accepts 4,500–9,000 Kbps for 1080p60 with H.264. Your upload speed must be comfortably above the total, including audio." },
  { question: "How much upload speed do I need to stream?", answer: "Plan to use no more than about 75% of your measured upload speed. For a 6,000 Kbps Twitch stream plus 160 Kbps audio, that means an upload of at least about 8.2 Mbps." },
  { question: "Why not use all of my upload speed?", answer: "Upload speed fluctuates, and other devices on your network share it. Leaving headroom prevents dropped frames and buffering for your viewers." },
  { question: "Should I use CBR or VBR in OBS?", answer: "Use CBR (constant bitrate) for live streaming. Twitch and YouTube both recommend it because it keeps the stream steady for the ingest server and viewers." },
  { question: "What keyframe interval should I set?", answer: "Set the keyframe interval to 2 seconds. Both Twitch and YouTube Live expect it, and some platforms reject other values." },
  { question: "Can I stream 1440p or 4K on Twitch?", answer: "Not on Twitch's standard ingest, which tops out at 1080p. YouTube Live accepts 1440p and 4K if your upload can carry the higher bitrates." },
];

export default function Page() {
  return <ToolPage slug={slug} heading="Video Bitrate Calculator" description={description} faqs={faqs} guide={<>
    <h2>How the bitrate is worked out</h2>
    <p>The calculator takes <strong>75% of your upload speed</strong> as a safe budget, subtracts <strong>160 Kbps for audio</strong>, and compares what’s left with the platform’s recommended range for your resolution and frame rate. If the budget covers the top of the range you get the recommended bitrate; if not, you get the most your connection can safely carry, and a lower resolution to try when it falls short.</p>
    <h2>Setting it in OBS</h2>
    <p>Open <strong>Settings → Output</strong>, set Output Mode to Advanced, and on the Streaming tab choose Rate Control <strong>CBR</strong>, enter the video bitrate, and set Keyframe Interval to <strong>2 s</strong>. Set the audio bitrate on the Audio tab, and the resolution and FPS under <strong>Settings → Video</strong>. The ranges follow Twitch’s and YouTube’s published H.264 guidance; check their current pages if you use HEVC or AV1, which need less bitrate for the same quality.</p>
  </>}><VideoBitrateCalculator /></ToolPage>;
}
