import { ImageBatchProcessor } from "@/components/files/image-workbench";
import { ToolPage } from "@/components/shared/tool-page";
import { toolMetadata } from "@/lib/seo";
const slug = "image-converter";
const description = "Convert PNG, JPEG, and WEBP images online with optional resizing and quality control.";
export const metadata = toolMetadata(slug, { title: "Image Converter – PNG, JPEG & WEBP", description });
export default function Page() { return <ToolPage slug={slug} heading="Image Converter" description={description} faqs={[]}><ImageBatchProcessor /></ToolPage>; }
