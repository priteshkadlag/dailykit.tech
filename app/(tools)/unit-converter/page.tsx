import { UnitConverter } from "@/components/calculators/study-unit-calculators";
import type { Faq } from "@/components/shared/faq-section";
import { ToolPage } from "@/components/shared/tool-page";
import { toolMetadata } from "@/lib/seo";

const slug = "unit-converter";
const description = "Convert length, weight, area, volume, temperature, speed, pressure, energy and more — including Indian units like guntha, cent, gaj and tola.";
export const metadata = toolMetadata(slug, { title: "Unit Converter – Length, Weight, Area, Temperature & More", description });
const faqs: Faq[] = [
  { question: "Which units are supported?", answer: "Over 90 units in 12 groups: length, weight, area, volume, temperature, speed, time, pressure, energy, power, fuel economy and angle, in metric, imperial/US and common Indian units." },
  { question: "How big is a guntha, a cent and a gaj?", answer: "1 guntha = 1,089 sq ft (101.17 m²), and 40 guntha make an acre. 1 cent = 435.6 sq ft, one-hundredth of an acre. A gaj is a square yard (9 sq ft). Bigha and biswa vary from state to state, so they aren't included." },
  { question: "How accurate are the conversions?", answer: "They use exact definitions (for example 1 inch = 2.54 cm and 1 lb = 0.45359237 kg) and show up to 10 significant figures." },
  { question: "How do I convert km/L to L/100 km?", answer: "Choose Fuel economy. L/100 km is 100 divided by km/L, so 20 km/L is 5 L/100 km." },
];
export default function Page() { return <ToolPage slug={slug} heading="Unit Converter" description={description} faqs={faqs}><UnitConverter /></ToolPage>; }
