import { IconEditor } from "@/components/files/icon-editor";
import { ToolPage } from "@/components/shared/tool-page";
import { toolMetadata } from "@/lib/seo";
const slug = "icon-editor";
const description = "Open a Windows ICO file, inspect its embedded sizes and color depths, and extract PNG layers.";
export const metadata = toolMetadata(slug, { title: "Icon Editor – View & Extract ICO Layers", description });
export default function Page() { return <ToolPage slug={slug} heading="Icon Editor" description={description} faqs={[]}><IconEditor /></ToolPage>; }
