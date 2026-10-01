import { IconConverter } from "@/components/files/image-workbench";
import { ToolPage } from "@/components/shared/tool-page";
import { toolMetadata } from "@/lib/seo";
const slug = "icon-converter";
const description = "Turn a PNG, JPEG, or WEBP image into a genuine multi-size Windows ICO file in your browser.";
export const metadata = toolMetadata(slug, { title: "Icon Converter – PNG to ICO", description });
export default function Page() { return <ToolPage slug={slug} heading="Icon Converter" description={description} faqs={[]}><IconConverter /></ToolPage>; }
