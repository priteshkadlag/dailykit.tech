import { RefinanceBreakevenCalculator } from "@/components/calculators/mortgage-calculators";
import { ToolPage } from "@/components/shared/tool-page";
import { toolMetadata } from "@/lib/seo";
const slug = "mortgage-refinance-breakeven-calculator";
const description = "Compare current and proposed mortgage payments, closing costs, interest and the number of months needed for refinance savings to break even.";
export const metadata = toolMetadata(slug, { title: "Mortgage Refinance Breakeven Calculator", description });
const faqs = [
  { question: "How is refinance break-even calculated?", answer: "Closing costs are divided by estimated monthly principal-and-interest savings. For example, $6,000 of costs and $200 monthly savings produce a 30-month break-even estimate." },
  { question: "What if the new loan has a longer term?", answer: "A longer term can lower the payment while increasing total interest. Compare both monthly savings and remaining interest, rather than relying on break-even alone." },
  { question: "Should financed closing costs be included?", answer: "Yes. Include all costs paid in cash or added to the new balance. Rolling costs into the loan also changes the payment, so request a lender Loan Estimate for an exact comparison." },
  { question: "Does the calculator include taxes and insurance?", answer: "No. It compares principal and interest because property taxes and insurance usually continue after refinancing. Include changes separately if the new arrangement affects them." },
  { question: "When might refinancing not make sense?", answer: "It may not help if savings are small, costs are high, the new term greatly extends repayment, or you expect to sell or refinance again before break-even." },
];
export default function Page() { return <ToolPage slug={slug} heading="Mortgage Refinance Breakeven Calculator" description={description} faqs={faqs} guide={<><h2>Compare more than the monthly payment</h2><p>A lower payment can come from a lower rate, a longer term, or both. Review break-even time alongside total remaining interest and how long you expect to keep the mortgage.</p><h2>Use lender-specific figures</h2><p>Enter actual closing costs and rates from written Loan Estimates. This calculation excludes taxes, escrow changes, prepayment rules and tax consequences and is not a lending recommendation.</p></>}><RefinanceBreakevenCalculator /></ToolPage>; }
