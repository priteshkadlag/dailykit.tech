import { IconConverter } from "@/components/files/image-workbench";
import { ToolPage } from "@/components/shared/tool-page";
import { toolMetadata } from "@/lib/seo";
const slug = "favicon-generator";
const description = "Create a multi-size favicon, Apple touch icon, and ready-to-copy HTML tags from one image.";
export const metadata = toolMetadata(slug, { title: "Favicon Generator – Website Icon Package", description });
export default function Page() { return <ToolPage slug={slug} heading="Favicon Generator" description={description} faqs={[]}><IconConverter favicon /></ToolPage>; }
