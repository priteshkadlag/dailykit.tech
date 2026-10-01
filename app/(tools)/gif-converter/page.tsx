import { GifConverter } from "@/components/files/gif-tools";
import { ToolPage } from "@/components/shared/tool-page";
import { toolMetadata } from "@/lib/seo";
const slug = "gif-converter";
const description = "Turn a sequence of PNG, JPEG, or WEBP images into a looping animated GIF.";
export const metadata = toolMetadata(slug, { title: "GIF Converter – Images to Animated GIF", description });
export default function Page() { return <ToolPage slug={slug} heading="GIF Converter" description={description} faqs={[]}><GifConverter /></ToolPage>; }
