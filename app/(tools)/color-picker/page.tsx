import { ColorPicker } from "@/components/files/color-picker";
import { ToolPage } from "@/components/shared/tool-page";
import { toolMetadata } from "@/lib/seo";
const slug = "color-picker";
const description = "Pick any color from an image or spectrum and copy its HEX, RGB, HSL, or CSS value.";
export const metadata = toolMetadata(slug, { title: "Color Picker – Pick HEX, RGB & HSL from Images", description });
export default function Page() { return <ToolPage slug={slug} heading="Color Picker" description={description} faqs={[]}><ColorPicker /></ToolPage>; }
