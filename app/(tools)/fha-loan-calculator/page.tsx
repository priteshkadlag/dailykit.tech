import { FhaLoanCalculator } from "@/components/calculators/mortgage-calculators";
import { ToolPage } from "@/components/shared/tool-page";
import { toolMetadata } from "@/lib/seo";
const slug = "fha-loan-calculator";
const description = "Estimate an FHA mortgage payment including down payment, financed upfront MIP, annual MIP, principal, interest, property taxes and insurance.";
export const metadata = toolMetadata(slug, { title: "FHA Loan Calculator – Mortgage Payment & MIP", description });
const faqs = [
  { question: "What does the FHA payment estimate include?", answer: "It includes principal and interest on the financed loan, estimated first-year annual MIP paid monthly, property tax, homeowners insurance and HOA dues entered." },
  { question: "What is upfront mortgage insurance premium?", answer: "Upfront MIP is charged on the base FHA loan amount and is commonly financed into the mortgage. The default field is 1.75%, but verify the applicable rate." },
  { question: "What annual MIP rate should I use?", answer: "The default 0.55% represents a common rate for a more-than-15-year FHA loan with LTV above 95% and a base amount within the applicable threshold. Actual rate and duration depend on loan details and current HUD policy." },
  { question: "Is 3.5% always the required down payment?", answer: "FHA permits a 3.5% minimum required investment in many cases, but eligibility, credit, property, loan-limit and underwriting rules apply. A lender determines the actual requirement." },
  { question: "Does this check the FHA loan limit?", answer: "No. FHA limits vary by year, property type and county. Check the current HUD limit and lender eligibility before relying on the estimate." },
  { question: "Is the result a loan approval or quote?", answer: "No. It is an educational estimate and does not include every fee, escrow adjustment or underwriting condition. Obtain official Loan Estimates from approved lenders." },
];
export default function Page() { return <ToolPage slug={slug} heading="FHA Loan Calculator" description={description} faqs={faqs} guide={<><h2>How FHA insurance is included</h2><p>The calculator adds upfront MIP to the base loan when financed and estimates the first year of annual MIP as a monthly amount. Actual annual MIP can change as the outstanding balance declines.</p><h2>Verify current HUD and lender rules</h2><p>Premium rates, duration, loan limits and eligibility can vary. Replace the defaults with lender-provided figures and review current HUD guidance before making a decision.</p></>}><FhaLoanCalculator /></ToolPage>; }
