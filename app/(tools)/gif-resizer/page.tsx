import { GifResizer } from "@/components/files/gif-tools";
import { ToolPage } from "@/components/shared/tool-page";
import { toolMetadata } from "@/lib/seo";
const slug = "gif-resizer";
const description = "Resize an animated GIF and adjust its playback speed while preserving every animation frame.";
export const metadata = toolMetadata(slug, { title: "GIF Resizer – Resize Animated GIFs", description });
export default function Page() { return <ToolPage slug={slug} heading="GIF Resizer" description={description} faqs={[]}><GifResizer /></ToolPage>; }
