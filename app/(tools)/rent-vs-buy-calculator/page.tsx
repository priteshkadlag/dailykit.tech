import { RentVsBuyCalculator } from "@/components/calculators/mortgage-calculators";
import { ToolPage } from "@/components/shared/tool-page";
import { toolMetadata } from "@/lib/seo";
const slug = "rent-vs-buy-calculator";
const description = "Compare estimated renting and homeownership costs using mortgage terms, property tax, maintenance, transaction costs, appreciation and rent inflation.";
export const metadata = toolMetadata(slug, { title: "Rent vs. Buy Calculator – Compare Housing Costs", description });
const faqs = [
  { question: "How does the calculator compare renting and buying?", answer: "It estimates rent paid and compares it with down payment, buying costs, mortgage payments, property tax and maintenance, less estimated net equity after selling costs." },
  { question: "Why does the time horizon matter?", answer: "Buying and selling involve large transaction costs. A longer stay provides more time for loan principal repayment and possible appreciation to offset those costs." },
  { question: "Is home appreciation guaranteed?", answer: "No. Home values can rise or fall, and local markets differ. Test conservative, flat and negative appreciation assumptions." },
  { question: "What ownership costs should I include?", answer: "Include realistic property tax, maintenance, buying and selling costs. Insurance, HOA, utilities, renovations and opportunity cost should also be considered outside this simplified comparison." },
  { question: "Does a lower net cost mean I should choose that option?", answer: "Not necessarily. Flexibility, job stability, maintenance responsibility, liquidity, neighborhood plans and personal preferences also matter." },
];
export default function Page() { return <ToolPage slug={slug} heading="Rent vs. Buy Calculator" description={description} faqs={faqs} guide={<><h2>A scenario comparison, not a forecast</h2><p>Results depend heavily on appreciation, rent growth, transaction costs and how long you stay. Change each assumption to understand the range of possible outcomes.</p><h2>Costs not fully modeled</h2><p>This simplified comparison does not calculate income-tax effects, renter investment returns, insurance differences, HOA dues or renovations. Review a complete local budget before making a housing decision.</p></>}><RentVsBuyCalculator /></ToolPage>; }
