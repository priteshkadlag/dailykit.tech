import type { Faq } from "@/components/shared/faq-section";
import type { CategorySlug } from "@/lib/tools";

export interface CategorySeoContent {
  title: string;
  description: string;
  heading: string;
  introduction: string;
  keywords: string[];
  guideTitle: string;
  guide: { title: string; text: string }[];
  faqs: Faq[];
  related: { name: string; href: string; text: string }[];
  imageAlt: string;
}

const common = {
  communication: {
    title: "Free Online Communication Tools & Templates | DailyKit",
    description: "Create clear WhatsApp messages and perfectly spaced social captions with free browser-based communication tools for customers, teams and followers.",
    heading: "Free online communication tools",
    introduction: "Write practical customer messages and clean social captions without starting from a blank page. Prepare reusable WhatsApp templates and preserve intentional spacing for social posts.",
    keywords: ["online communication tools", "WhatsApp message generator", "customer message templates", "social media caption spacer", "caption line breaks"],
    guideTitle: "Create messages that are ready to send",
    guide: [
      { title: "Choose the right format", text: "Start with a message template for orders, payments or occasions, or use the caption spacer when line breaks are the main concern." },
      { title: "Personalize the details", text: "Replace example names, amounts and dates, then check the tone and facts before copying the finished text." },
      { title: "Preview before publishing", text: "Paste the result into the destination app and confirm links, spacing, emojis and character limits before sending." },
    ],
    faqs: [
      { question: "Are the communication tools free?", answer: "Yes. The listed tools are free to use in your browser and do not require an account for their core features." },
      { question: "Can I create WhatsApp business messages?", answer: "Yes. The WhatsApp Message Generator includes starting points for orders, payments, reminders and customer communication that you can personalize." },
      { question: "Why do blank lines disappear from social captions?", answer: "Some platforms collapse empty lines or trim spaces. The caption spacer inserts compatible spacing so intentional breaks are more likely to remain." },
      { question: "Do these tools send messages automatically?", answer: "No. They prepare text for you to review and copy. You control the recipient, destination and final send action." },
      { question: "Should I review generated message templates?", answer: "Yes. Verify names, dates, prices, links and claims, and adjust the tone for your audience before sending or publishing." },
    ],
    related: [
      { name: "Text & Content Tools", href: "/category/text-tools", text: "Count, transform and generate text for messages and posts." },
      { name: "QR & Security Tools", href: "/category/qr-security", text: "Create WhatsApp, URL, WiFi and payment QR codes." },
      { name: "Business Tools", href: "/category/business-tools", text: "Prepare invoices, quotations and everyday business calculations." },
    ],
    imageAlt: "DailyKit free online communication and message tools",
  },
  "text-tools": {
    title: "Free Online Text & Content Tools for Writers | DailyKit",
    description: "Count words and characters, change text case, generate placeholder copy, add caption spacing and copy invisible characters with free online tools.",
    heading: "Free online text and content tools",
    introduction: "Edit, measure and prepare text for documents, interfaces, SEO snippets and social posts—from checking length and keyword use to changing case or generating layout copy.",
    keywords: ["free text tools", "word counter", "character counter", "case converter", "lorem ipsum generator", "invisible character", "caption spacer"],
    guideTitle: "Choose the right text tool",
    guide: [
      { title: "Measure content", text: "Use the word and character counter for limits, reading-time estimates and a quick view of repeated terms." },
      { title: "Transform or generate", text: "Change capitalization with the case converter or create placeholder paragraphs with the Lorem Ipsum generator." },
      { title: "Prepare text for platforms", text: "Use caption spacing or compatible invisible characters only where the destination platform supports them." },
    ],
    faqs: [
      { question: "Which tool checks title and meta description length?", answer: "The Word & Character Counter reports character totals, making it useful for checking titles, descriptions, posts and form limits." },
      { question: "Can I convert text to camelCase or snake_case?", answer: "Yes. The Case Converter supports writing cases and developer formats including camelCase, PascalCase, snake_case and kebab-case." },
      { question: "What is an invisible character?", answer: "It is a Unicode character that occupies a text position without displaying like a normal letter. Support varies, so test it in the destination app." },
      { question: "Is Lorem Ipsum suitable for published content?", answer: "Lorem Ipsum is placeholder copy for layouts and prototypes. Replace it with accurate, useful original content before publishing." },
      { question: "Is text saved or uploaded?", answer: "The tools are designed to work in your browser. Copy or download important results and avoid treating the page as permanent storage." },
    ],
    related: [
      { name: "Communication Tools", href: "/category/communication", text: "Turn prepared text into customer messages and social captions." },
      { name: "Font Converters", href: "/category/font-converters", text: "Convert text between Unicode and supported legacy fonts." },
      { name: "Typing Tools", href: "/category/typing-tools", text: "Type in Indian and international languages online." },
    ],
    imageAlt: "DailyKit free online text and content tools",
  },
  "health-fitness": {
    title: "Free Health & Fitness Calculators Online | DailyKit",
    description: "Estimate TDEE, daily macros, pregnancy due dates and one-rep max strength with free health and fitness calculators for planning and education.",
    heading: "Free health and fitness calculators",
    introduction: "Estimate planning numbers for nutrition, pregnancy dates and strength training. Results are educational estimates based on your inputs, not a diagnosis or personalized medical advice.",
    keywords: ["health calculators", "fitness calculators", "TDEE calculator", "macro calculator", "pregnancy due date calculator", "one rep max calculator"],
    guideTitle: "Use health estimates responsibly",
    guide: [
      { title: "Enter accurate inputs", text: "Use current measurements and the closest matching activity or training data to reduce avoidable estimation error." },
      { title: "Treat results as a range", text: "Equations simplify real biology and performance. Track real outcomes over time instead of relying on one calculated number." },
      { title: "Know when to seek advice", text: "Ask a qualified clinician for pregnancy or health decisions and a trained professional for individualized nutrition or exercise programming." },
    ],
    faqs: [
      { question: "Are these calculators medical advice?", answer: "No. They provide educational estimates and cannot diagnose a condition or replace advice from a qualified healthcare professional." },
      { question: "How accurate is a TDEE calculator?", answer: "TDEE formulas provide a starting estimate. Actual energy needs vary, so compare the result with weight and performance trends over several weeks." },
      { question: "What does the macro calculator estimate?", answer: "It divides a calorie target into estimated daily grams of protein, carbohydrate and fat according to the selected goal." },
      { question: "Can the due date calculator confirm pregnancy dates?", answer: "No. It estimates dates from the information entered. A healthcare professional can assess gestational age using clinical information and ultrasound." },
      { question: "Is a calculated one-rep max safe to attempt?", answer: "The estimate is for programming guidance, not a requirement to attempt a maximum lift. Use appropriate technique, supervision and conservative loading." },
    ],
    related: [
      { name: "Everyday Calculators", href: "/category/calculators", text: "Browse all calculation tools in one directory." },
      { name: "Productivity Tools", href: "/category/productivity", text: "Plan tasks and calculate dates for day-to-day work." },
      { name: "All Tools", href: "/tools", text: "Explore the complete DailyKit tool collection." },
    ],
    imageAlt: "DailyKit health and fitness calculators",
  },
  "real-estate-tools": {
    title: "Free Real Estate & Mortgage Calculators | DailyKit",
    description: "Compare renting versus buying, mortgage refinance break-even timing and estimated FHA loan payments with free online real estate calculators.",
    heading: "Free real estate and mortgage calculators",
    introduction: "Compare housing scenarios with transparent inputs for purchase costs, rent growth, refinancing and FHA mortgage insurance. Use results to frame questions, then verify local costs.",
    keywords: ["real estate calculators", "mortgage calculator", "rent vs buy calculator", "refinance break even calculator", "FHA loan calculator", "housing costs"],
    guideTitle: "Compare housing scenarios with better inputs",
    guide: [
      { title: "Use current local costs", text: "Enter realistic taxes, insurance, rent, fees and closing costs because these can materially change the comparison." },
      { title: "Test more than one scenario", text: "Compare conservative and optimistic assumptions for rates, appreciation, maintenance and how long you expect to stay." },
      { title: "Confirm lender-specific figures", text: "Treat results as estimates and verify rates, mortgage insurance, eligibility and cash-to-close with qualified local professionals." },
    ],
    faqs: [
      { question: "Can these calculators tell me whether to rent or buy?", answer: "They compare the assumptions you enter, but the decision also depends on flexibility, risk, maintenance, taxes and personal financial goals." },
      { question: "What is a refinance break-even point?", answer: "It is the estimated time for monthly savings from a new loan to recover refinancing costs. Selling or refinancing earlier may prevent recovery." },
      { question: "Does the FHA calculator include mortgage insurance?", answer: "It estimates upfront and annual mortgage insurance using the assumptions shown. Confirm current terms with an approved lender." },
      { question: "Are property taxes and insurance exact?", answer: "No. They vary by property, location, insurer and time. Use recent quotes or statements whenever possible." },
      { question: "Are the results a loan offer or financial advice?", answer: "No. Results are educational estimates and are not approval, a rate quote, an appraisal or personalized financial advice." },
    ],
    related: [
      { name: "Finance Tools", href: "/category/finance-tools", text: "Calculate loans, interest, savings and everyday money scenarios." },
      { name: "EMI Calculator", href: "/emi-calculator", text: "Estimate monthly loan payments and view an amortization schedule." },
      { name: "Percentage Calculator", href: "/percentage-calculator", text: "Check percentage changes used in price and rate comparisons." },
    ],
    imageAlt: "DailyKit real estate and mortgage calculators",
  },
  "creator-tools": {
    title: "Free Video Creator & Streaming Tools Online | DailyKit",
    description: "Calculate OBS streaming bitrate, convert video aspect ratios and format valid YouTube chapter timestamps with free browser tools for creators.",
    heading: "Free creator and streaming tools",
    introduction: "Prepare livestream settings, social-video dimensions and YouTube chapter timestamps with focused browser utilities and carry each result into your publishing workflow.",
    keywords: ["creator tools", "streaming tools", "OBS bitrate calculator", "aspect ratio calculator", "YouTube chapter generator", "video tools"],
    guideTitle: "Plan video and streaming details before publishing",
    guide: [
      { title: "Match the destination", text: "Choose settings and dimensions for the platform where the video or stream will actually be published." },
      { title: "Leave practical headroom", text: "Use a sustainable bitrate below tested upload capacity so brief network changes do not immediately disrupt a stream." },
      { title: "Validate the final format", text: "Check export dimensions and paste timestamps into a draft description to catch ordering or formatting errors." },
    ],
    faqs: [
      { question: "What bitrate should I use for OBS?", answer: "It depends on upload speed, resolution, frame rate, encoder and platform limits. The calculator provides a practical starting estimate." },
      { question: "Can I convert 16:9 dimensions to 9:16?", answer: "Yes. The Aspect Ratio Calculator helps find exact crop or export dimensions for vertical video, square posts and other target ratios." },
      { question: "What makes YouTube chapters valid?", answer: "A chapter list should start at 0:00, use timestamps in ascending order and provide sufficiently long sections. The generator checks and formats it." },
      { question: "Do these tools upload or edit my videos?", answer: "No. They calculate settings, dimensions and timestamp text. Apply the results in your streaming, editing or publishing software." },
      { question: "Are platform requirements always the same?", answer: "No. Platforms can change limits and recommendations. Confirm important settings in the destination platform's current documentation." },
    ],
    related: [
      { name: "Image Tools", href: "/category/image-tools", text: "Resize, compress and convert thumbnails and social graphics." },
      { name: "Text & Content Tools", href: "/category/text-tools", text: "Measure and format descriptions, captions and supporting copy." },
      { name: "Communication Tools", href: "/category/communication", text: "Prepare readable captions and shareable messages." },
    ],
    imageAlt: "DailyKit tools for video creators and streamers",
  },
  "developer-tools": {
    title: "Free Online Developer Tools & Utilities | DailyKit",
    description: "Format JSON and code, encode Base64, inspect JWTs, test regex, generate hashes and use dozens of fast browser-based utilities for developers.",
    heading: "Free online developer tools and utilities",
    introduction: "Format, convert, encode, inspect and test common development data in your browser. Tools are grouped so you can move quickly from JSON and Base64 to regex, timestamps and web diagnostics.",
    keywords: ["online developer tools", "JSON formatter", "Base64 encoder", "JWT decoder", "regex tester", "hash generator", "web developer utilities"],
    guideTitle: "Fast utilities for everyday development work",
    guide: [
      { title: "Format and validate", text: "Make structured data and code easier to inspect, then use validation feedback to locate syntax problems." },
      { title: "Encode, decode and convert", text: "Move between common representations such as Base64, URL encoding, timestamps, number bases and color formats." },
      { title: "Protect sensitive values", text: "Use sample or redacted data for debugging. Decoding a token does not verify its signature, safety or authorization." },
    ],
    faqs: [
      { question: "Are the developer tools free?", answer: "Yes. This collection is free in the browser for common formatting, conversion, generation and testing tasks." },
      { question: "Can I format and validate JSON?", answer: "Yes. Use the JSON tools to format compact data, improve readability and identify common syntax errors before using it in an application." },
      { question: "Does decoding a JWT verify that it is authentic?", answer: "No. Decoding only displays header and payload data. Authenticity requires signature verification using the expected algorithm and trusted key." },
      { question: "Should I paste production secrets into online tools?", answer: "No. Avoid entering passwords, private keys, live access tokens, personal data or other confidential production values." },
      { question: "Can these tools replace project tests?", answer: "No. They help with quick inspection and experiments, but application behavior still needs repeatable tests, reviews and environment-specific checks." },
    ],
    related: [
      { name: "Text & Content Tools", href: "/category/text-tools", text: "Transform text and check counts for documentation and UI copy." },
      { name: "QR & Security Tools", href: "/category/qr-security", text: "Generate passwords and QR codes for common payloads." },
      { name: "Image Tools", href: "/category/image-tools", text: "Prepare image and icon assets for sites and applications." },
    ],
    imageAlt: "DailyKit free online developer tools and utilities",
  },
} satisfies Partial<Record<CategorySlug, CategorySeoContent>>;

export const categorySeoContent: Partial<Record<CategorySlug, CategorySeoContent>> = common;
