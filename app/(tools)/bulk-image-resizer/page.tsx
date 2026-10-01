import { ImageBatchProcessor } from "@/components/files/image-workbench";
import { ToolPage } from "@/components/shared/tool-page";
import { toolMetadata } from "@/lib/seo";
const slug = "bulk-image-resizer";
const description = "Resize, convert, and compress up to 20 images at once, then download the complete batch as a ZIP.";
export const metadata = toolMetadata(slug, { title: "Bulk Image Resizer – Resize Multiple Images", description });
export default function Page() { return <ToolPage slug={slug} heading="Bulk Image Resizer" description={description} faqs={[]}><ImageBatchProcessor bulk /></ToolPage>; }
