import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { absoluteUrl, defaultOgImage, siteConfig } from "@/lib/site";
import { categories, getCategory, getImageToolsByGroup, getFontConvertersByGroup, getPdfToolsByGroup, getToolSections, getToolsInCategory, getTypingToolsByGroup } from "@/lib/tools";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { JsonLd } from "@/components/shared/json-ld";
import { FaqSection, type Faq } from "@/components/shared/faq-section";
import { CategoryTools } from "@/components/shared/tool-card";
import { ToolIcon } from "@/components/shared/tool-icon";
import { categorySeoContent } from "@/lib/category-seo";

const PDF_PROMISES = [
  { title: "Nothing is uploaded", text: "Every PDF tool runs inside your browser. Your files never reach our servers and are cleared when you close the page." },
  { title: "Free, no sign-up", text: "No watermarks, no daily limits and no account needed. PDFs up to 100 MB each." },
  { title: "Works on your phone", text: "Merge, sign, compress or convert from any modern browser — Android, iPhone, Windows or Mac." },
];

const PDF_FAQS: Faq[] = [
  { question: "Are these PDF tools really free?", answer: "Yes. Every PDF tool is free to use, with no watermark added to your files and no sign-up required." },
  { question: "Is it safe to use these tools with confidential documents?", answer: "Yes. Your PDFs are processed on your own device and never uploaded. The only downloads are program files — for example OCR language data — never your documents." },
  { question: "Which tool should I use for a government portal upload?", answer: "Use Compress PDF to get under the size limit, and PDF to PDF/A if the portal asks for an archival (PDF/A) file." },
  { question: "Can I edit a scanned PDF's text?", answer: "Run OCR PDF first to make the text searchable and copyable, then convert it with PDF to Word to edit it." },
  { question: "Can I merge, split, or rearrange PDF pages?", answer: "Yes. Merge PDF combines files, Split PDF and Extract PDF Pages create smaller files, and Organize PDF reorders, rotates, duplicates, or removes pages." },
  { question: "Can I sign or password-protect a PDF?", answer: "Yes. Sign PDF adds a drawn, typed, or uploaded signature. Protect PDF adds a password, while Unlock PDF removes one from a file you are authorized to open." },
  { question: "Do the PDF tools work on phones and computers?", answer: "Yes. They work in modern browsers on Android, iPhone, Windows, and Mac. Larger files may process faster on devices with more available memory." },
];

const PDF_TITLE = "Free Online PDF Tools to Edit & Convert | DailyKit";
const PDF_DESCRIPTION =
  "Merge, split, compress, convert, edit, sign, protect and organize PDF files with free online tools that process documents privately in your browser.";
const PDF_KEYWORDS = ["free PDF tools", "online PDF editor", "merge PDF", "split PDF", "compress PDF", "convert PDF", "sign PDF", "protect PDF", "OCR PDF", "organize PDF pages"];
const PDF_RELATED_LINKS = [
  { name: "Image Compressor", href: "/image-compressor", text: "Reduce image file size before placing pictures into a document." },
  { name: "Image Resizer", href: "/image-resizer", text: "Resize photos and graphics to the dimensions your document needs." },
  { name: "Invoice Generator", href: "/invoice-generator", text: "Create a professional invoice and download the finished document as PDF." },
];

const TYPING_FAQS: Faq[] = [
  { question: "Do I need to install a font or keyboard?", answer: "No. Type with the on-screen keys or your normal keyboard — the page converts each key to your language. Only Kruti Dev text needs the Kruti Dev font installed to read it in other apps." },
  { question: "What is the difference between Kruti Dev and Mangal (Unicode)?", answer: "Mangal/InScript produces Unicode Hindi that works everywhere — WhatsApp, email, Google. Kruti Dev is an older font-based layout still required by some typing exams and offices; its text only looks right in the Kruti Dev font." },
  { question: "Is my text saved or uploaded?", answer: "No. Everything you type stays in your browser. Copy it, print it, or download it as a TXT or Word-compatible DOC file before you leave the page." },
  { question: "Can I type on my phone?", answer: "Yes. Tap the on-screen keys; the keyboard scrolls sideways on narrow screens." },
  { question: "Which languages and keyboard layouts are available?", answer: "The collection includes keyboards for major Indian scripts and selected international languages. Available layouts are grouped on this page so you can open the exact language and input method you need." },
  { question: "Can I copy or download the text I type?", answer: "Yes. You can copy text for use in messages and documents, print it, or download it in supported text and document-friendly formats." },
  { question: "Why does Kruti Dev text look like English letters elsewhere?", answer: "Kruti Dev uses Latin character codes that display as Hindi only when a compatible Kruti Dev font is applied. For text that works across modern apps and websites, use a Unicode Hindi keyboard or convert the legacy text to Unicode." },
];

const TYPING_TITLE = "Free Online Keyboards for Indian Languages | DailyKit";
const TYPING_DESCRIPTION =
  "Type Hindi, Marathi, Bengali, Tamil, Urdu and more with free online language keyboards. Copy, format, print or download text from your browser.";
const TYPING_KEYWORDS = [
  "online language keyboard",
  "Indian language keyboard",
  "Hindi typing online",
  "Marathi keyboard",
  "Bengali keyboard",
  "Tamil keyboard",
  "Urdu keyboard",
  "Kruti Dev keyboard",
  "Unicode typing tool",
];
const TYPING_RELATED_LINKS = [
  { name: "Krutidev to Unicode", href: "/krutidev-to-unicode", text: "Convert legacy Kruti Dev Hindi text into portable Unicode text." },
  { name: "Unicode to Krutidev", href: "/unicode-to-krutidev", text: "Prepare Unicode Hindi for workflows that still require Kruti Dev encoding." },
  { name: "WhatsApp Message Generator", href: "/whatsapp-message-generator", text: "Create a customer or occasion message, then add your multilingual text." },
];

const BUSINESS_TITLE = "Free Business Tools for Small Businesses | DailyKit";
const BUSINESS_DESCRIPTION =
  "Create invoices and quotations, calculate profit margins and shipping costs, and track expenses with free online tools for small businesses.";
const BUSINESS_KEYWORDS = [
  "free business tools",
  "small business tools",
  "online invoice generator",
  "quotation generator",
  "profit margin calculator",
  "shipping cost calculator",
  "business expense tracker",
];

const BUSINESS_FAQS: Faq[] = [
  {
    question: "Are these business tools free to use?",
    answer: "Yes. You can open and use every business tool on this page for free. The invoice and quotation generators also let you create and download professional documents.",
  },
  {
    question: "Which tool can I use to create a GST invoice?",
    answer: "Use the Invoice Generator to prepare GST or non-GST invoices, add customer and item details, calculate totals, and download the finished invoice as a PDF.",
  },
  {
    question: "Can I make a quotation before sending an invoice?",
    answer: "Yes. The Quotation Generator creates a branded estimate with automatic totals. Once the customer approves it, you can create the final bill with the Invoice Generator.",
  },
  {
    question: "How do I calculate profit margin and markup?",
    answer: "Enter your cost price and selling price in the Profit Margin Calculator. It shows profit, margin, and markup, and can also help you find a target selling price.",
  },
  {
    question: "How is courier chargeable weight calculated?",
    answer: "The Shipping Cost Calculator compares the parcel's actual weight with its volumetric weight. Couriers generally charge using whichever value is higher.",
  },
  {
    question: "Can I track daily business expenses?",
    answer: "Yes. The Daily Expense Tracker records spending by category and provides charts and reports so you can review where your money goes.",
  },
  {
    question: "Do these tools work on mobile phones?",
    answer: "Yes. The tools are designed for modern phone, tablet, and desktop browsers, so you can use them at a shop counter, office, or while travelling.",
  },
];

const BUSINESS_RELATED_LINKS = [
  { name: "GST Calculator", href: "/gst-calculator", text: "Add or remove GST and view the CGST, SGST, or IGST split." },
  { name: "Percentage Calculator", href: "/percentage-calculator", text: "Check percentage changes, ratios, increases, and decreases." },
  { name: "QR Code Generator", href: "/qr-code-generator", text: "Create UPI payment, website, WiFi, and WhatsApp QR codes." },
];

const FINANCE_TITLE = "Free Online Financial Calculators for India | DailyKit";
const FINANCE_DESCRIPTION =
  "Calculate GST, EMI, discounts, percentages, SIP returns, fixed deposit maturity and simple interest with free online financial calculators for India.";
const FINANCE_KEYWORDS = [
  "financial calculators",
  "finance tools India",
  "GST calculator",
  "EMI calculator",
  "SIP calculator",
  "FD calculator",
  "discount calculator",
  "percentage calculator",
  "simple interest calculator",
];

const FINANCE_FAQS: Faq[] = [
  {
    question: "Are these financial calculators free to use?",
    answer: "Yes. Every calculator on this page is free to use in a modern browser, and you do not need an account for calculations.",
  },
  {
    question: "How can I add or remove GST from an amount?",
    answer: "Use the GST Calculator and choose inclusive or exclusive GST. It calculates the taxable amount, total tax, and the CGST and SGST or IGST split.",
  },
  {
    question: "What information do I need to calculate a loan EMI?",
    answer: "Enter the loan amount, annual interest rate, and loan tenure. The EMI Calculator shows the monthly payment, total interest, total repayment, and an amortization schedule.",
  },
  {
    question: "Are SIP and FD results guaranteed returns?",
    answer: "No. SIP results are estimates based on an assumed rate of return, while FD results depend on the entered interest rate and compounding choice. Actual returns, taxes, and provider terms may differ.",
  },
  {
    question: "What is the difference between simple interest and compound interest?",
    answer: "Simple interest is calculated only on the original principal. Compound interest also earns interest on previously accumulated interest, so its value can grow faster over time.",
  },
  {
    question: "Can I calculate multiple discounts and GST together?",
    answer: "Yes. The Discount Calculator supports successive discounts and a discount-plus-GST mode to show the final payable price.",
  },
  {
    question: "Can these calculators provide financial advice?",
    answer: "No. They provide mathematical estimates from the values you enter. Use lender, bank, tax, or qualified professional guidance before making important financial decisions.",
  },
];

const FINANCE_RELATED_LINKS = [
  { name: "Invoice Generator", href: "/invoice-generator", text: "Create GST or non-GST invoices and download them as PDF files." },
  { name: "Profit Margin Calculator", href: "/profit-margin-calculator", text: "Compare cost, selling price, profit, margin, and markup." },
  { name: "Daily Expense Tracker", href: "/expense-tracker", text: "Record spending by category and review charts and reports." },
];

const CALCULATORS_TITLE = "Free Online Calculators for Everyday Use | DailyKit";
const CALCULATORS_DESCRIPTION =
  "Use free online calculators for GST, EMI, percentages, discounts, investments, profit, shipping, age and BMI. Fast results on phone or desktop.";
const CALCULATORS_KEYWORDS = [
  "free online calculators",
  "everyday calculators",
  "financial calculators",
  "business calculators",
  "GST calculator",
  "EMI calculator",
  "percentage calculator",
  "age calculator",
  "BMI calculator",
  "profit margin calculator",
];

const CALCULATORS_FAQS: Faq[] = [
  {
    question: "Are all calculators on this page free?",
    answer: "Yes. Every calculator listed here is free to use in a modern browser, and you do not need to create an account to perform calculations.",
  },
  {
    question: "Which calculators are available?",
    answer: "The collection includes GST, EMI, percentage, discount, SIP, fixed deposit, simple interest, profit margin, shipping cost, age, and BMI calculators.",
  },
  {
    question: "Can I use these calculators on a mobile phone?",
    answer: "Yes. Each calculator is designed for phone, tablet, and desktop screens with touch-friendly controls and results that update from your inputs.",
  },
  {
    question: "Are financial calculator results exact?",
    answer: "The arithmetic follows the values and options you enter, but real loans, investments, taxes, and deposits can include provider rules, fees, rounding, or changing rates. Treat results as estimates and verify important decisions.",
  },
  {
    question: "What is the difference between margin and markup?",
    answer: "Profit margin measures profit as a percentage of selling price, while markup measures profit as a percentage of cost price. The Profit Margin Calculator shows both values.",
  },
  {
    question: "How does the shipping calculator choose chargeable weight?",
    answer: "It compares actual parcel weight with volumetric weight and uses the higher value as chargeable weight, following the common approach used by courier services.",
  },
  {
    question: "Does the BMI calculator provide a medical diagnosis?",
    answer: "No. BMI is a general screening measure based on height and weight, not a diagnosis. Health needs vary, so speak with a qualified healthcare professional for personal guidance.",
  },
];

const CALCULATORS_RELATED_LINKS = [
  { name: "Invoice Generator", href: "/invoice-generator", text: "Turn item, tax, and total figures into a professional invoice." },
  { name: "Quotation Generator", href: "/quotation-generator", text: "Create a branded customer estimate with automatic totals." },
  { name: "Daily Expense Tracker", href: "/expense-tracker", text: "Record everyday spending and review category-based reports." },
];

const IMAGE_TITLE = "Free Online Image Tools: Resize & Convert | DailyKit";
const IMAGE_DESCRIPTION =
  "Resize, compress and convert images, edit GIFs, create ICO files and favicons, or pick colors with free online tools that work in your browser.";
const IMAGE_KEYWORDS = [
  "free online image tools",
  "image resizer",
  "image compressor",
  "image converter",
  "bulk image resizer",
  "GIF resizer",
  "GIF maker",
  "ICO converter",
  "favicon generator",
  "image color picker",
];
const IMAGE_FAQS: Faq[] = [
  { question: "Are these online image tools free?", answer: "Yes. Every image tool in this collection is free to use in a modern browser, with no account required for processing images." },
  { question: "Which image formats can I resize or convert?", answer: "The tools support common browser-readable formats such as PNG, JPEG, WEBP, GIF, BMP, and SVG where applicable. Available output formats depend on the selected tool." },
  { question: "What is the difference between resizing and compressing an image?", answer: "Resizing changes pixel dimensions, while compression reduces file size through encoding and quality settings. You can use both when an upload has dimension and file-size limits." },
  { question: "Can I process several images at once?", answer: "Yes. Bulk Image Resizer can resize, convert, or compress multiple images in one batch and package the processed files into a ZIP download." },
  { question: "Can I resize an animated GIF without removing animation?", answer: "Yes. GIF Resizer is designed for animated files and can resize, crop, adjust playback speed, and optimize the result while retaining animation." },
  { question: "Can I create Windows icons and website favicons?", answer: "Yes. Icon Converter creates multi-size ICO files, while Favicon Generator produces common favicon sizes and ready-to-use HTML code for a website." },
  { question: "Are my images uploaded to a server?", answer: "The image tools process files in your browser. Your device performance and available memory can affect processing time for large images or animation files." },
];
const IMAGE_RELATED_LINKS = [
  { name: "Image to PDF", href: "/image-to-pdf", text: "Combine JPG, PNG, and WEBP images into one PDF document." },
  { name: "PDF to Image", href: "/pdf-to-image", text: "Export PDF pages as high-quality JPG or PNG images." },
  { name: "QR Code Generator", href: "/qr-code-generator", text: "Create downloadable QR codes for links, payments, WiFi, and messages." },
];

const SECURITY_TITLE = "Free QR Code Generator & Security Tools | DailyKit";
const SECURITY_DESCRIPTION =
  "Create QR codes and strong passwords, or sign, protect, unlock and redact PDF files with free browser-based QR and document security tools online.";
const SECURITY_KEYWORDS = [
  "free QR code generator",
  "online security tools",
  "UPI QR code generator",
  "WiFi QR code",
  "password generator",
  "protect PDF",
  "unlock PDF",
  "sign PDF",
  "redact PDF",
];
const SECURITY_FAQS: Faq[] = [
  { question: "Are these QR and security tools free?", answer: "Yes. Every tool in this collection is free to use in a modern browser. You can generate QR codes and passwords or work with supported PDF security tools without paying." },
  { question: "What types of QR codes can I create?", answer: "The QR Code Generator supports links, text, WiFi credentials, UPI payments, WhatsApp messages, email, phone numbers, SMS, contact details, and locations." },
  { question: "How do I make a QR code easy to scan?", answer: "Use strong contrast, keep the surrounding quiet zone clear, avoid stretching the image, and test the downloaded QR code on more than one phone before printing or publishing it." },
  { question: "Are passwords generated securely?", answer: "The Password Generator creates random passwords in your browser. Use a unique password for every account and store important credentials in a trusted password manager." },
  { question: "Can I add or remove a password from a PDF?", answer: "Protect PDF adds a password and document restrictions. Unlock PDF removes a password only from a PDF you can open and are authorized to modify." },
  { question: "Does covering text with a black box permanently redact it?", answer: "A visual black box alone may leave underlying content recoverable. Use Redact PDF to permanently remove sensitive areas, then review the exported file before sharing it." },
  { question: "Is an online PDF signature legally binding?", answer: "A placed signature can record your intent, but legal requirements vary by document and jurisdiction. Confirm whether your use case requires a regulated digital-signature service or identity verification." },
];
const SECURITY_RELATED_LINKS = [
  { name: "WhatsApp Message Generator", href: "/whatsapp-message-generator", text: "Prepare a message, then share it directly or encode its destination in a QR code." },
  { name: "Invoice Generator", href: "/invoice-generator", text: "Create GST or non-GST invoices with professional PDF download." },
  { name: "Compare PDF", href: "/compare-pdf", text: "Review differences between two document versions before approval or signing." },
];

const PRODUCTIVITY_TITLE = "Free Online Productivity Tools for Daily Work | DailyKit";
const PRODUCTIVITY_DESCRIPTION =
  "Plan tasks and reminders, track daily expenses, and calculate exact ages or upcoming birthdays with free productivity tools for everyday work.";
const PRODUCTIVITY_KEYWORDS = [
  "free productivity tools",
  "online task manager",
  "reminder tool",
  "daily expense tracker",
  "age calculator",
  "daily planner",
  "personal productivity tools",
];
const PRODUCTIVITY_FAQS: Faq[] = [
  { question: "Are these productivity tools free?", answer: "Yes. The task manager, expense tracker, and age calculator are free to use. You can begin using each tool directly from this page." },
  { question: "What can I organize with the task manager?", answer: "You can create tasks, assign priorities and due dates, mark work as complete, and use reminders to keep important personal or business activities visible." },
  { question: "Can I track daily personal and business expenses?", answer: "Yes. The Daily Expense Tracker records spending by category and provides charts and reports. Keep separate records when you need a clear distinction between personal and business costs." },
  { question: "How does the age calculator work?", answer: "Enter a date of birth and the date on which you want to calculate age. The tool returns completed years, months, and days, plus a countdown to the next birthday." },
  { question: "Can I use these tools on my phone?", answer: "Yes. Each tool is designed for modern mobile, tablet, and desktop browsers with touch-friendly controls and responsive layouts." },
  { question: "Should reminders be used for urgent or critical alerts?", answer: "Do not rely on a browser reminder as your only alert for medical, safety, legal, payment, or other critical deadlines. Keep an additional calendar or verified notification where missing the event would cause harm." },
  { question: "Do productivity tools replace accounting or project-management software?", answer: "No. These tools are intended for straightforward daily planning, calculations, and expense records. Complex teams, tax filings, or formal accounts may require specialist software or professional guidance." },
];
const PRODUCTIVITY_RELATED_LINKS = [
  { name: "Invoice Generator", href: "/invoice-generator", text: "Create customer invoices with item totals, taxes, and PDF download." },
  { name: "WhatsApp Message Generator", href: "/whatsapp-message-generator", text: "Prepare order, payment, reminder, and customer messages quickly." },
  { name: "Percentage Calculator", href: "/percentage-calculator", text: "Calculate shares, percentage changes, increases, and decreases." },
];

const FONT_TITLE = "Free Online Unicode & Legacy Font Converters | DailyKit";
const FONT_DESCRIPTION =
  "Convert text between Unicode and legacy Hindi, Marathi, Gujarati, Punjabi, Bangla, Tamil, Kannada, Malayalam and Nepali font encodings online.";
const FONT_KEYWORDS = [
  "Unicode font converter",
  "legacy font converter",
  "Kruti Dev to Unicode",
  "Unicode to Kruti Dev",
  "Shree Lipi converter",
  "Preeti to Unicode",
  "Bamini to Unicode",
  "Bijoy to Unicode",
  "Nudi to Unicode",
  "Indian language font converter",
];
const FONT_FAQS: Faq[] = [
  { question: "What is a legacy font converter?", answer: "A legacy font converter maps text stored with an older font-specific character layout into Unicode, or converts Unicode back to a supported legacy layout. It changes the text encoding, not just its visual font." },
  { question: "Why does legacy text look garbled on another device?", answer: "Legacy text often depends on a specific installed font. Without that font, the stored characters can display as unrelated Latin symbols. Converting the text to Unicode usually makes it portable across modern apps and devices." },
  { question: "Which languages and font systems are supported?", answer: "Live converters cover selected Hindi, Marathi, Gujarati, Punjabi, Bangla, Tamil, Kannada, Malayalam, and Nepali legacy systems, plus Hindi-to-Roman, Devanagari-to-Braille, and UK or US English spelling conversion." },
  { question: "Do I need the original legacy font installed?", answer: "You may need the original font to read or verify legacy text visually. Conversion can still work from the underlying character sequence when the correct source format is known." },
  { question: "Can I convert Unicode text back to a legacy font?", answer: "Yes, when a live reverse converter is listed for that font system. Use the matching direction because legacy layouts are not interchangeable even when they support the same language." },
  { question: "Will formatting and page layout be preserved?", answer: "These tools convert plain text, not complete document layouts. Font sizes, tables, columns, images, and word-processing styles must be handled separately in the destination application." },
  { question: "Is the converted text always perfect?", answer: "Conversion follows the supported mapping, but unusual glyphs, mixed encodings, damaged copy-and-paste text, or a wrongly identified source font can require manual review. Proofread names, numbers, punctuation, and official text before use." },
  { question: "Is my text uploaded?", answer: "Conversion runs in your browser. Copy or download the result you need, and avoid relying on the page as permanent storage for important text." },
];
const FONT_RELATED_LINKS = [
  { name: "Hindi Online Keyboard", href: "/hindi-mangal-keyboard", text: "Type new Unicode Hindi with an on-screen keyboard and familiar input options." },
  { name: "Marathi Online Keyboard", href: "/marathi-keyboard", text: "Write and format Unicode Marathi directly in your browser." },
  { name: "OCR PDF", href: "/ocr-pdf", text: "Make scanned PDF pages searchable before copying text for review or conversion." },
];

export const dynamicParams = false;

export function generateStaticParams() {
  return categories.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: PageProps<"/category/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const category = getCategory(slug);
  if (!category) return {};
  if (category.slug === "business-tools") {
    const path = `/category/${category.slug}`;
    return {
      title: { absolute: BUSINESS_TITLE },
      description: BUSINESS_DESCRIPTION,
      keywords: BUSINESS_KEYWORDS,
      alternates: { canonical: path },
      openGraph: {
        type: "website",
        title: BUSINESS_TITLE,
        description: BUSINESS_DESCRIPTION,
        url: absoluteUrl(path),
        siteName: siteConfig.name,
        locale: siteConfig.locale,
        images: [{ ...defaultOgImage, alt: "DailyKit free online business tools" }],
      },
      twitter: {
        card: "summary_large_image",
        title: BUSINESS_TITLE,
        description: BUSINESS_DESCRIPTION,
        images: [defaultOgImage.url],
      },
    };
  }
  if (category.slug === "finance-tools") {
    const path = `/category/${category.slug}`;
    return {
      title: { absolute: FINANCE_TITLE },
      description: FINANCE_DESCRIPTION,
      keywords: FINANCE_KEYWORDS,
      alternates: { canonical: path },
      openGraph: {
        type: "website",
        title: FINANCE_TITLE,
        description: FINANCE_DESCRIPTION,
        url: absoluteUrl(path),
        siteName: siteConfig.name,
        locale: siteConfig.locale,
        images: [{ ...defaultOgImage, alt: "DailyKit free online financial calculators for India" }],
      },
      twitter: {
        card: "summary_large_image",
        title: FINANCE_TITLE,
        description: FINANCE_DESCRIPTION,
        images: [defaultOgImage.url],
      },
    };
  }
  if (category.slug === "calculators") {
    const path = `/category/${category.slug}`;
    return {
      title: { absolute: CALCULATORS_TITLE },
      description: CALCULATORS_DESCRIPTION,
      keywords: CALCULATORS_KEYWORDS,
      alternates: { canonical: path },
      openGraph: {
        type: "website",
        title: CALCULATORS_TITLE,
        description: CALCULATORS_DESCRIPTION,
        url: absoluteUrl(path),
        siteName: siteConfig.name,
        locale: siteConfig.locale,
        images: [{ ...defaultOgImage, alt: "DailyKit free online calculators for everyday use" }],
      },
      twitter: {
        card: "summary_large_image",
        title: CALCULATORS_TITLE,
        description: CALCULATORS_DESCRIPTION,
        images: [defaultOgImage.url],
      },
    };
  }
  if (category.slug === "pdf-tools") {
    const path = `/category/${category.slug}`;
    return {
      title: { absolute: PDF_TITLE },
      description: PDF_DESCRIPTION,
      keywords: PDF_KEYWORDS,
      alternates: { canonical: path },
      openGraph: {
        type: "website",
        title: PDF_TITLE,
        description: PDF_DESCRIPTION,
        url: absoluteUrl(path),
        siteName: siteConfig.name,
        locale: siteConfig.locale,
        images: [{ ...defaultOgImage, alt: "DailyKit free online tools for editing and converting PDF files" }],
      },
      twitter: { card: "summary_large_image", title: PDF_TITLE, description: PDF_DESCRIPTION, images: [defaultOgImage.url] },
    };
  }
  if (category.slug === "image-tools") {
    const path = `/category/${category.slug}`;
    return {
      title: { absolute: IMAGE_TITLE },
      description: IMAGE_DESCRIPTION,
      keywords: IMAGE_KEYWORDS,
      alternates: { canonical: path },
      openGraph: {
        type: "website",
        title: IMAGE_TITLE,
        description: IMAGE_DESCRIPTION,
        url: absoluteUrl(path),
        siteName: siteConfig.name,
        locale: siteConfig.locale,
        images: [{ ...defaultOgImage, alt: "DailyKit free online tools for resizing and converting images" }],
      },
      twitter: { card: "summary_large_image", title: IMAGE_TITLE, description: IMAGE_DESCRIPTION, images: [defaultOgImage.url] },
    };
  }
  if (category.slug === "qr-security") {
    const path = `/category/${category.slug}`;
    return {
      title: { absolute: SECURITY_TITLE },
      description: SECURITY_DESCRIPTION,
      keywords: SECURITY_KEYWORDS,
      alternates: { canonical: path },
      openGraph: {
        type: "website",
        title: SECURITY_TITLE,
        description: SECURITY_DESCRIPTION,
        url: absoluteUrl(path),
        siteName: siteConfig.name,
        locale: siteConfig.locale,
        images: [{ ...defaultOgImage, alt: "DailyKit QR code generator and online document security tools" }],
      },
      twitter: { card: "summary_large_image", title: SECURITY_TITLE, description: SECURITY_DESCRIPTION, images: [defaultOgImage.url] },
    };
  }
  if (category.slug === "productivity") {
    const path = `/category/${category.slug}`;
    return {
      title: { absolute: PRODUCTIVITY_TITLE },
      description: PRODUCTIVITY_DESCRIPTION,
      keywords: PRODUCTIVITY_KEYWORDS,
      alternates: { canonical: path },
      openGraph: {
        type: "website",
        title: PRODUCTIVITY_TITLE,
        description: PRODUCTIVITY_DESCRIPTION,
        url: absoluteUrl(path),
        siteName: siteConfig.name,
        locale: siteConfig.locale,
        images: [{ ...defaultOgImage, alt: "DailyKit free online productivity tools for daily work" }],
      },
      twitter: { card: "summary_large_image", title: PRODUCTIVITY_TITLE, description: PRODUCTIVITY_DESCRIPTION, images: [defaultOgImage.url] },
    };
  }
  if (category.slug === "font-converters") {
    const path = `/category/${category.slug}`;
    return {
      title: { absolute: FONT_TITLE },
      description: FONT_DESCRIPTION,
      keywords: FONT_KEYWORDS,
      alternates: { canonical: path },
      openGraph: {
        type: "website",
        title: FONT_TITLE,
        description: FONT_DESCRIPTION,
        url: absoluteUrl(path),
        siteName: siteConfig.name,
        locale: siteConfig.locale,
        images: [{ ...defaultOgImage, alt: "DailyKit Unicode and legacy Indian language font converters" }],
      },
      twitter: { card: "summary_large_image", title: FONT_TITLE, description: FONT_DESCRIPTION, images: [defaultOgImage.url] },
    };
  }
  if (category.slug === "typing-tools") {
    const path = `/category/${category.slug}`;
    return {
      title: { absolute: TYPING_TITLE },
      description: TYPING_DESCRIPTION,
      keywords: TYPING_KEYWORDS,
      alternates: { canonical: path },
      openGraph: {
        type: "website",
        title: TYPING_TITLE,
        description: TYPING_DESCRIPTION,
        url: absoluteUrl(path),
        siteName: siteConfig.name,
        locale: siteConfig.locale,
        images: [{ ...defaultOgImage, alt: "DailyKit free online keyboards for Indian and international languages" }],
      },
      twitter: { card: "summary_large_image", title: TYPING_TITLE, description: TYPING_DESCRIPTION, images: [defaultOgImage.url] },
    };
  }
  const seo = categorySeoContent[category.slug];
  const title = seo?.title ?? `Free Online ${category.name} for India`;
  const description = seo?.description ?? category.description;
  const path = `/category/${category.slug}`;
  return {
    title: seo ? { absolute: title } : title,
    description,
    keywords: seo?.keywords,
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      title,
      description,
      url: absoluteUrl(path),
      siteName: siteConfig.name,
      locale: siteConfig.locale,
      images: [{ ...defaultOgImage, alt: seo?.imageAlt ?? `${category.name} on ${siteConfig.name}` }],
    },
    twitter: { card: "summary_large_image", title, description, images: [defaultOgImage.url] },
  };
}

export default async function CategoryPage({ params }: PageProps<"/category/[slug]">) {
  const { slug } = await params;
  const category = getCategory(slug);
  if (!category) notFound();
  const list = getToolsInCategory(category.slug);
  const seo = categorySeoContent[category.slug];

  if (category.slug === "business-tools") {
    const liveTools = list.filter((tool) => tool.status === "live");
    const pageUrl = absoluteUrl("/category/business-tools");

    return (
      <div className="mx-auto max-w-6xl space-y-14 px-4 py-6 sm:px-6 sm:py-10">
        <header className="space-y-5">
          <Breadcrumbs items={[{ name: "Business Tools", href: "/category/business-tools" }]} />
          <div className="rounded-2xl border bg-card px-5 py-8 sm:px-8 sm:py-10">
            <div className="flex items-start gap-4">
              <span className="hidden size-12 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground sm:flex">
                <ToolIcon name="briefcase" className="size-6" />
              </span>
              <div className="max-w-3xl space-y-3">
                <p className="text-sm font-semibold text-primary">Free online tools · No complicated setup</p>
                <h1 className="text-3xl font-bold tracking-tight text-balance sm:text-4xl">Free Online Business Tools for Everyday Work</h1>
                <p className="text-base leading-relaxed text-muted-foreground sm:text-lg">
                  Create invoices and quotations, check profit margins and delivery costs, and organise daily expenses. These practical tools help small businesses, shopkeepers, freelancers, and sellers complete routine work faster.
                </p>
                <ul className="flex flex-wrap gap-x-5 gap-y-2 pt-1 text-sm text-muted-foreground" aria-label="Business tool benefits">
                  {[`${liveTools.length} focused tools`, "Mobile friendly", "Instant results"].map((benefit) => (
                    <li key={benefit} className="flex items-center gap-1.5">
                      <CheckCircle2 className="size-4 text-primary" aria-hidden /> {benefit}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </header>

        <section aria-labelledby="business-tools-heading" className="space-y-5">
          <div className="max-w-3xl">
            <h2 id="business-tools-heading" className="text-2xl font-bold tracking-tight">Choose a business tool</h2>
            <p className="mt-2 leading-relaxed text-muted-foreground">Start with the task you need to finish. Each tool has a focused workspace and clear inputs, with no unrelated features in the way.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {liveTools.map((tool) => (
              <article key={tool.slug} className="flex h-full flex-col rounded-xl bg-card p-5 ring-1 ring-foreground/10 transition-shadow hover:shadow-md">
                <span className="flex size-11 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                  <ToolIcon name={tool.icon} className="size-5" />
                </span>
                <h3 className="mt-4 text-lg font-semibold">{tool.name}</h3>
                <p className="mt-1 flex-1 text-sm leading-relaxed text-muted-foreground">{tool.shortDescription}</p>
                <Link href={`/${tool.slug}`} className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-brand px-4 text-sm font-medium text-white shadow-sm shadow-blue-700/25 transition-[filter,box-shadow] hover:shadow-md hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  Use Tool <ArrowRight className="size-4" aria-hidden />
                </Link>
              </article>
            ))}
          </div>
        </section>

        <section aria-labelledby="workflow-heading" className="space-y-5">
          <div className="max-w-3xl">
            <h2 id="workflow-heading" className="text-2xl font-bold tracking-tight">Tools for common small-business workflows</h2>
            <p className="mt-2 leading-relaxed text-muted-foreground">Use individual tools for one-off jobs or combine them into a simple sales and record-keeping workflow.</p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {[
              { title: "Prepare customer documents", text: "Build a quotation first, then create a GST or non-GST invoice when the customer confirms the order.", links: [["Create a quotation", "/quotation-generator"], ["Create an invoice", "/invoice-generator"]] },
              { title: "Price products confidently", text: "Compare cost and selling price, understand markup, and account for courier charges before confirming your price.", links: [["Calculate profit margin", "/profit-margin-calculator"], ["Estimate shipping cost", "/shipping-cost-calculator"]] },
              { title: "Review daily spending", text: "Record purchases and operating costs by category, then use charts and reports to spot spending patterns.", links: [["Track business expenses", "/expense-tracker"]] },
            ].map((workflow) => (
              <article key={workflow.title} className="rounded-xl border bg-card p-5">
                <h3 className="font-semibold">{workflow.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{workflow.text}</p>
                <ul className="mt-4 space-y-2">
                  {workflow.links.map(([label, href]) => (
                    <li key={href}><Link href={href} className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">{label} <ArrowRight className="size-3.5" aria-hidden /></Link></li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>

        <section aria-labelledby="related-tools-heading" className="space-y-5">
          <div>
            <h2 id="related-tools-heading" className="text-2xl font-bold tracking-tight">Related tools for running your business</h2>
            <p className="mt-2 text-muted-foreground">Continue with tax calculations, quick percentage checks, or payment-ready QR codes.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {BUSINESS_RELATED_LINKS.map((item) => (
              <Link key={item.href} href={item.href} className="group rounded-xl border bg-card p-5 transition-colors hover:border-primary/40">
                <h3 className="flex items-center gap-2 font-semibold">{item.name}<ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden /></h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.text}</p>
              </Link>
            ))}
          </div>
          <p className="text-sm text-muted-foreground">Browse more options in <Link href="/category/finance-tools" className="font-medium text-primary hover:underline">Finance Tools</Link>, <Link href="/category/productivity" className="font-medium text-primary hover:underline">Productivity Tools</Link>, or the <Link href="/tools" className="font-medium text-primary hover:underline">complete tool directory</Link>.</p>
        </section>

        <div className="max-w-3xl">
          <FaqSection faqs={BUSINESS_FAQS} title="Business tools: frequently asked questions" />
        </div>

        <JsonLd
          data={[
            {
              "@context": "https://schema.org",
              "@type": "CollectionPage",
              "@id": `${pageUrl}#collection`,
              name: "Free Online Business Tools for Everyday Work",
              description: BUSINESS_DESCRIPTION,
              url: pageUrl,
              isPartOf: { "@id": `${siteConfig.url}#website` },
              mainEntity: { "@id": `${pageUrl}#tool-list` },
            },
            {
              "@context": "https://schema.org",
              "@type": "ItemList",
              "@id": `${pageUrl}#tool-list`,
              name: "DailyKit business tools",
              numberOfItems: liveTools.length,
              itemListElement: liveTools.map((tool, index) => ({
                "@type": "ListItem",
                position: index + 1,
                name: tool.name,
                url: absoluteUrl(`/${tool.slug}`),
              })),
            },
            {
              "@context": "https://schema.org",
              "@type": "WebSite",
              "@id": `${siteConfig.url}#website`,
              name: siteConfig.name,
              url: siteConfig.url,
              publisher: { "@id": `${siteConfig.url}#organization` },
            },
            {
              "@context": "https://schema.org",
              "@type": "Organization",
              "@id": `${siteConfig.url}#organization`,
              name: siteConfig.name,
              url: siteConfig.url,
            },
          ]}
        />
      </div>
    );
  }

  if (category.slug === "finance-tools") {
    const liveTools = list.filter((tool) => tool.status === "live");
    const pageUrl = absoluteUrl("/category/finance-tools");

    return (
      <div className="mx-auto max-w-6xl space-y-14 px-4 py-6 sm:px-6 sm:py-10">
        <header className="space-y-5">
          <Breadcrumbs items={[{ name: "Finance Tools", href: "/category/finance-tools" }]} />
          <div className="rounded-2xl border bg-card px-5 py-8 sm:px-8 sm:py-10">
            <div className="flex items-start gap-4">
              <span className="hidden size-12 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground sm:flex">
                <ToolIcon name="landmark" className="size-6" />
              </span>
              <div className="max-w-3xl space-y-3">
                <p className="text-sm font-semibold text-primary">Free calculators · Results update instantly</p>
                <h1 className="text-3xl font-bold tracking-tight text-balance sm:text-4xl">Free Online Financial Calculators for India</h1>
                <p className="text-base leading-relaxed text-muted-foreground sm:text-lg">
                  Calculate taxes, loan payments, discounts, investment estimates, deposit maturity, and interest using straightforward finance tools designed for common Indian money decisions.
                </p>
                <ul className="flex flex-wrap gap-x-5 gap-y-2 pt-1 text-sm text-muted-foreground" aria-label="Finance calculator benefits">
                  {[`${liveTools.length} focused calculators`, "Indian tax and currency context", "Mobile friendly"].map((benefit) => (
                    <li key={benefit} className="flex items-center gap-1.5">
                      <CheckCircle2 className="size-4 text-primary" aria-hidden /> {benefit}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </header>

        <section aria-labelledby="finance-tools-heading" className="space-y-5">
          <div className="max-w-3xl">
            <h2 id="finance-tools-heading" className="text-2xl font-bold tracking-tight">Choose a financial calculator</h2>
            <p className="mt-2 leading-relaxed text-muted-foreground">Select the calculation you need and enter your values. Each calculator explains its result so you can review the numbers clearly.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {liveTools.map((tool) => (
              <article key={tool.slug} className="flex h-full flex-col rounded-xl bg-card p-5 ring-1 ring-foreground/10 transition-shadow hover:shadow-md">
                <span className="flex size-11 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                  <ToolIcon name={tool.icon} className="size-5" />
                </span>
                <h3 className="mt-4 text-lg font-semibold">{tool.name}</h3>
                <p className="mt-1 flex-1 text-sm leading-relaxed text-muted-foreground">{tool.shortDescription}</p>
                <Link href={`/${tool.slug}`} className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-brand px-4 text-sm font-medium text-white shadow-sm shadow-blue-700/25 transition-[filter,box-shadow] hover:shadow-md hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  Use Tool <ArrowRight className="size-4" aria-hidden />
                </Link>
              </article>
            ))}
          </div>
        </section>

        <section aria-labelledby="finance-use-cases-heading" className="space-y-5">
          <div className="max-w-3xl">
            <h2 id="finance-use-cases-heading" className="text-2xl font-bold tracking-tight">Find the right calculator for your question</h2>
            <p className="mt-2 leading-relaxed text-muted-foreground">The best tool depends on whether you are checking a purchase, comparing borrowing costs, or estimating savings and returns.</p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {[
              { title: "Taxes, prices, and discounts", text: "Add or remove GST, calculate sale prices, and measure percentage increases or decreases.", links: [["Calculate GST", "/gst-calculator"], ["Check a discount", "/discount-calculator"], ["Calculate a percentage", "/percentage-calculator"]] },
              { title: "Loans and borrowing", text: "Estimate a monthly instalment and review how principal and interest change across the repayment schedule.", links: [["Calculate loan EMI", "/emi-calculator"], ["Calculate simple interest", "/simple-interest-calculator"]] },
              { title: "Savings and investments", text: "Estimate monthly SIP growth or calculate the maturity value and interest earned on a fixed deposit.", links: [["Estimate SIP returns", "/sip-calculator"], ["Calculate FD maturity", "/fd-calculator"]] },
            ].map((useCase) => (
              <article key={useCase.title} className="rounded-xl border bg-card p-5">
                <h3 className="font-semibold">{useCase.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{useCase.text}</p>
                <ul className="mt-4 space-y-2">
                  {useCase.links.map(([label, href]) => (
                    <li key={href}><Link href={href} className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">{label} <ArrowRight className="size-3.5" aria-hidden /></Link></li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
          <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground"><strong className="font-semibold text-foreground">Important:</strong> Results are estimates based on your inputs. Rates, taxes, fees, rounding rules, and financial product terms can change, so confirm important figures with the relevant bank, lender, tax source, or qualified adviser.</p>
        </section>

        <section aria-labelledby="finance-related-heading" className="space-y-5">
          <div>
            <h2 id="finance-related-heading" className="text-2xl font-bold tracking-tight">Related business and money tools</h2>
            <p className="mt-2 text-muted-foreground">Turn your calculations into practical records for billing, pricing, and expense review.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {FINANCE_RELATED_LINKS.map((item) => (
              <Link key={item.href} href={item.href} className="group rounded-xl border bg-card p-5 transition-colors hover:border-primary/40">
                <h3 className="flex items-center gap-2 font-semibold">{item.name}<ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden /></h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.text}</p>
              </Link>
            ))}
          </div>
          <p className="text-sm text-muted-foreground">Explore the <Link href="/category/business-tools" className="font-medium text-primary hover:underline">Business Tools</Link>, browse <Link href="/category/calculators" className="font-medium text-primary hover:underline">all calculators</Link>, or visit the <Link href="/tools" className="font-medium text-primary hover:underline">complete tool directory</Link>.</p>
        </section>

        <div className="max-w-3xl">
          <FaqSection faqs={FINANCE_FAQS} title="Financial calculators: frequently asked questions" />
        </div>

        <JsonLd
          data={[
            {
              "@context": "https://schema.org",
              "@type": "CollectionPage",
              "@id": `${pageUrl}#collection`,
              name: "Free Online Financial Calculators for India",
              description: FINANCE_DESCRIPTION,
              url: pageUrl,
              isPartOf: { "@id": `${siteConfig.url}#website` },
              mainEntity: { "@id": `${pageUrl}#tool-list` },
            },
            {
              "@context": "https://schema.org",
              "@type": "ItemList",
              "@id": `${pageUrl}#tool-list`,
              name: "DailyKit financial calculators",
              numberOfItems: liveTools.length,
              itemListElement: liveTools.map((tool, index) => ({
                "@type": "ListItem",
                position: index + 1,
                name: tool.name,
                url: absoluteUrl(`/${tool.slug}`),
              })),
            },
            {
              "@context": "https://schema.org",
              "@type": "WebSite",
              "@id": `${siteConfig.url}#website`,
              name: siteConfig.name,
              url: siteConfig.url,
              publisher: { "@id": `${siteConfig.url}#organization` },
            },
            {
              "@context": "https://schema.org",
              "@type": "Organization",
              "@id": `${siteConfig.url}#organization`,
              name: siteConfig.name,
              url: siteConfig.url,
            },
          ]}
        />
      </div>
    );
  }

  if (category.slug === "calculators") {
    const liveTools = list.filter((tool) => tool.status === "live");
    const pageUrl = absoluteUrl("/category/calculators");

    return (
      <div className="mx-auto max-w-6xl space-y-14 px-4 py-6 sm:px-6 sm:py-10">
        <header className="space-y-5">
          <Breadcrumbs items={[{ name: "Calculators", href: "/category/calculators" }]} />
          <div className="rounded-2xl border bg-card px-5 py-8 sm:px-8 sm:py-10">
            <div className="flex items-start gap-4">
              <span className="hidden size-12 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground sm:flex">
                <ToolIcon name="calculator" className="size-6" />
              </span>
              <div className="max-w-3xl space-y-3">
                <p className="text-sm font-semibold text-primary">Free online calculators · Clear, instant results</p>
                <h1 className="text-3xl font-bold tracking-tight text-balance sm:text-4xl">Free Online Calculators for Everyday Use</h1>
                <p className="text-base leading-relaxed text-muted-foreground sm:text-lg">
                  Solve common money, business, date, and health calculations in one place. Choose a focused calculator, enter your values, and get a clear result without installing an app.
                </p>
                <ul className="flex flex-wrap gap-x-5 gap-y-2 pt-1 text-sm text-muted-foreground" aria-label="Online calculator benefits">
                  {[`${liveTools.length} practical calculators`, "No sign-up for calculations", "Phone and desktop friendly"].map((benefit) => (
                    <li key={benefit} className="flex items-center gap-1.5">
                      <CheckCircle2 className="size-4 text-primary" aria-hidden /> {benefit}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </header>

        <section aria-labelledby="all-calculators-heading" className="space-y-5">
          <div className="max-w-3xl">
            <h2 id="all-calculators-heading" className="text-2xl font-bold tracking-tight">Choose an online calculator</h2>
            <p className="mt-2 leading-relaxed text-muted-foreground">Each tool is built around one calculation, with concise inputs and useful result details for checking your work.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {liveTools.map((tool) => (
              <article key={tool.slug} className="flex h-full flex-col rounded-xl bg-card p-5 ring-1 ring-foreground/10 transition-shadow hover:shadow-md">
                <span className="flex size-11 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                  <ToolIcon name={tool.icon} className="size-5" />
                </span>
                <h3 className="mt-4 text-lg font-semibold">{tool.name}</h3>
                <p className="mt-1 flex-1 text-sm leading-relaxed text-muted-foreground">{tool.shortDescription}</p>
                <Link href={`/${tool.slug}`} className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-brand px-4 text-sm font-medium text-white shadow-sm shadow-blue-700/25 transition-[filter,box-shadow] hover:shadow-md hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  Use Tool <ArrowRight className="size-4" aria-hidden />
                </Link>
              </article>
            ))}
          </div>
        </section>

        <section aria-labelledby="calculator-types-heading" className="space-y-5">
          <div className="max-w-3xl">
            <h2 id="calculator-types-heading" className="text-2xl font-bold tracking-tight">Calculators by task</h2>
            <p className="mt-2 leading-relaxed text-muted-foreground">Start with the question you want to answer, then open the calculator made for that job.</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[
              { title: "Prices and percentages", text: "Work out GST, sale discounts, percentages, increases, and decreases.", links: [["GST", "/gst-calculator"], ["Discount", "/discount-calculator"], ["Percentage", "/percentage-calculator"]] },
              { title: "Loans and investments", text: "Estimate EMIs, SIP growth, fixed-deposit maturity, or simple interest.", links: [["EMI", "/emi-calculator"], ["SIP", "/sip-calculator"], ["FD", "/fd-calculator"], ["Simple interest", "/simple-interest-calculator"]] },
              { title: "Business calculations", text: "Check product profitability and estimate courier chargeable weight and cost.", links: [["Profit margin", "/profit-margin-calculator"], ["Shipping cost", "/shipping-cost-calculator"]] },
              { title: "Personal calculations", text: "Find exact age and next-birthday timing, or check BMI and a general healthy-weight range.", links: [["Age", "/age-calculator"], ["BMI", "/bmi-calculator"]] },
            ].map((group) => (
              <article key={group.title} className="rounded-xl border bg-card p-5">
                <h3 className="font-semibold">{group.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{group.text}</p>
                <ul className="mt-4 flex flex-wrap gap-2">
                  {group.links.map(([label, href]) => (
                    <li key={href}><Link href={href} className="inline-flex min-h-9 items-center rounded-full border px-3 text-sm font-medium hover:border-primary/40 hover:bg-accent">{label}</Link></li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
          <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground"><strong className="font-semibold text-foreground">Please note:</strong> Financial and health results are informational estimates. Confirm important financial figures with the relevant provider or adviser, and consult a qualified healthcare professional for personal medical guidance.</p>
        </section>

        <section aria-labelledby="calculator-related-heading" className="space-y-5">
          <div>
            <h2 id="calculator-related-heading" className="text-2xl font-bold tracking-tight">Related tools for your next step</h2>
            <p className="mt-2 text-muted-foreground">Use your calculated figures in business documents or keep them alongside everyday expense records.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {CALCULATORS_RELATED_LINKS.map((item) => (
              <Link key={item.href} href={item.href} className="group rounded-xl border bg-card p-5 transition-colors hover:border-primary/40">
                <h3 className="flex items-center gap-2 font-semibold">{item.name}<ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden /></h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.text}</p>
              </Link>
            ))}
          </div>
          <p className="text-sm text-muted-foreground">Browse focused collections in <Link href="/category/finance-tools" className="font-medium text-primary hover:underline">Finance Tools</Link> and <Link href="/category/business-tools" className="font-medium text-primary hover:underline">Business Tools</Link>, or explore the <Link href="/tools" className="font-medium text-primary hover:underline">complete tool directory</Link>.</p>
        </section>

        <div className="max-w-3xl">
          <FaqSection faqs={CALCULATORS_FAQS} title="Online calculators: frequently asked questions" />
        </div>

        <JsonLd
          data={[
            {
              "@context": "https://schema.org",
              "@type": "CollectionPage",
              "@id": `${pageUrl}#collection`,
              name: "Free Online Calculators for Everyday Use",
              description: CALCULATORS_DESCRIPTION,
              url: pageUrl,
              isPartOf: { "@id": `${siteConfig.url}#website` },
              mainEntity: { "@id": `${pageUrl}#tool-list` },
            },
            {
              "@context": "https://schema.org",
              "@type": "ItemList",
              "@id": `${pageUrl}#tool-list`,
              name: "DailyKit online calculators",
              numberOfItems: liveTools.length,
              itemListElement: liveTools.map((tool, index) => ({
                "@type": "ListItem",
                position: index + 1,
                name: tool.name,
                url: absoluteUrl(`/${tool.slug}`),
              })),
            },
            {
              "@context": "https://schema.org",
              "@type": "WebSite",
              "@id": `${siteConfig.url}#website`,
              name: siteConfig.name,
              url: siteConfig.url,
              publisher: { "@id": `${siteConfig.url}#organization` },
            },
            {
              "@context": "https://schema.org",
              "@type": "Organization",
              "@id": `${siteConfig.url}#organization`,
              name: siteConfig.name,
              url: siteConfig.url,
            },
          ]}
        />
      </div>
    );
  }

  if (category.slug === "pdf-tools") {
    const liveTools = list.filter((tool) => tool.status === "live");
    const pageUrl = absoluteUrl("/category/pdf-tools");
    const groupDescriptions: Record<string, string> = {
      organize: "Combine, separate, reorder, rotate, or scan pages into a clean PDF.",
      optimize: "Reduce file size, repair damaged documents, or make scanned pages searchable.",
      "convert-to": "Create PDFs from images, documents, spreadsheets, slides, or HTML.",
      "convert-from": "Turn PDFs into editable documents, images, spreadsheets, slides, or archival PDF/A.",
      edit: "Modify pages, add content, fill forms, apply watermarks, crop, or number pages.",
      security: "Sign documents and control access to confidential or sensitive content.",
      intelligence: "Summarize, translate, or extract structured text from a PDF.",
    };

    return (
      <div className="mx-auto max-w-6xl space-y-14 px-4 py-6 sm:px-6 sm:py-10">
        <header className="space-y-5">
          <Breadcrumbs items={[{ name: "PDF Tools", href: "/category/pdf-tools" }]} />
          <div className="rounded-2xl border bg-card px-5 py-8 sm:px-8 sm:py-10">
            <div className="flex items-start gap-4">
              <span className="hidden size-12 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground sm:flex"><ToolIcon name="file-stack" className="size-6" /></span>
              <div className="max-w-3xl space-y-3">
                <p className="text-sm font-semibold text-primary">Free PDF tools · Files stay on your device</p>
                <h1 className="text-3xl font-bold tracking-tight text-balance sm:text-4xl">Free Online PDF Tools to Edit, Convert and Organize</h1>
                <p className="text-base leading-relaxed text-muted-foreground sm:text-lg">Merge pages, reduce file size, convert documents, edit content, add signatures, and protect sensitive PDFs. Choose a focused tool and process the file directly in your browser.</p>
                <ul className="flex flex-wrap gap-x-5 gap-y-2 pt-1 text-sm text-muted-foreground" aria-label="PDF tool benefits">
                  {["Browser-based processing", "No watermarks", "Phone and desktop friendly"].map((benefit) => <li key={benefit} className="flex items-center gap-1.5"><CheckCircle2 className="size-4 text-primary" aria-hidden /> {benefit}</li>)}
                </ul>
              </div>
            </div>
          </div>
        </header>

        <section aria-labelledby="pdf-tools-heading" className="space-y-8">
          <div className="max-w-3xl">
            <h2 id="pdf-tools-heading" className="text-2xl font-bold tracking-tight">Choose a PDF tool by task</h2>
            <p className="mt-2 leading-relaxed text-muted-foreground">Tools are grouped by the job they perform, so you can move directly from your document problem to the right workspace.</p>
          </div>
          {getPdfToolsByGroup().map((group) => (
            <section key={group.id} aria-labelledby={`pdf-group-${group.id}`} className="space-y-4">
              <div><h2 id={`pdf-group-${group.id}`} className="text-xl font-semibold tracking-tight">{group.name}</h2><p className="mt-1 text-sm text-muted-foreground">{groupDescriptions[group.id]}</p></div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {group.tools.filter((tool) => tool.status === "live").map((tool) => (
                  <article key={tool.slug} className="flex h-full flex-col rounded-xl bg-card p-5 ring-1 ring-foreground/10 transition-shadow hover:shadow-md">
                    <span className="flex size-11 items-center justify-center rounded-lg bg-accent text-accent-foreground"><ToolIcon name={tool.icon} className="size-5" /></span>
                    <h3 className="mt-4 font-semibold">{tool.name}</h3>
                    <p className="mt-1 flex-1 text-sm leading-relaxed text-muted-foreground">{tool.shortDescription}</p>
                    <Link href={`/${tool.slug}`} className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-brand px-4 text-sm font-medium text-white shadow-sm shadow-blue-700/25 transition-[filter,box-shadow] hover:shadow-md hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">Use Tool <ArrowRight className="size-4" aria-hidden /></Link>
                  </article>
                ))}
              </div>
            </section>
          ))}
        </section>

        <section aria-labelledby="pdf-privacy-heading" className="space-y-5">
          <div className="max-w-3xl"><h2 id="pdf-privacy-heading" className="text-2xl font-bold tracking-tight">Private PDF processing in your browser</h2><p className="mt-2 leading-relaxed text-muted-foreground">Your documents are processed locally on your device rather than uploaded for server-side processing. Performance depends on file complexity, size, and available device memory.</p></div>
          <div className="grid gap-4 sm:grid-cols-3">
            {PDF_PROMISES.map((promise) => <article key={promise.title} className="rounded-xl border bg-card p-5"><h3 className="font-semibold">{promise.title}</h3><p className="mt-2 text-sm leading-relaxed text-muted-foreground">{promise.text}</p></article>)}
          </div>
        </section>

        <section aria-labelledby="pdf-related-heading" className="space-y-5">
          <div><h2 id="pdf-related-heading" className="text-2xl font-bold tracking-tight">Related image and business tools</h2><p className="mt-2 text-muted-foreground">Prepare source images or create business documents before exporting and managing them as PDFs.</p></div>
          <div className="grid gap-4 sm:grid-cols-3">
            {PDF_RELATED_LINKS.map((item) => <Link key={item.href} href={item.href} className="group rounded-xl border bg-card p-5 transition-colors hover:border-primary/40"><h3 className="flex items-center gap-2 font-semibold">{item.name}<ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden /></h3><p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.text}</p></Link>)}
          </div>
          <p className="text-sm text-muted-foreground">Explore more in <Link href="/category/image-tools" className="font-medium text-primary hover:underline">Image Tools</Link>, <Link href="/category/business-tools" className="font-medium text-primary hover:underline">Business Tools</Link>, or the <Link href="/tools" className="font-medium text-primary hover:underline">complete tool directory</Link>.</p>
        </section>

        <div className="max-w-3xl"><FaqSection faqs={PDF_FAQS} title="PDF tools: frequently asked questions" /></div>
        <JsonLd data={[
          { "@context": "https://schema.org", "@type": "CollectionPage", "@id": `${pageUrl}#collection`, name: "Free Online PDF Tools to Edit, Convert and Organize", description: PDF_DESCRIPTION, url: pageUrl, isPartOf: { "@id": `${siteConfig.url}#website` }, mainEntity: { "@id": `${pageUrl}#tool-list` } },
          { "@context": "https://schema.org", "@type": "ItemList", "@id": `${pageUrl}#tool-list`, name: "DailyKit online PDF tools", numberOfItems: liveTools.length, itemListElement: liveTools.map((tool, index) => ({ "@type": "ListItem", position: index + 1, name: tool.name, url: absoluteUrl(`/${tool.slug}`) })) },
          { "@context": "https://schema.org", "@type": "WebSite", "@id": `${siteConfig.url}#website`, name: siteConfig.name, url: siteConfig.url, publisher: { "@id": `${siteConfig.url}#organization` } },
          { "@context": "https://schema.org", "@type": "Organization", "@id": `${siteConfig.url}#organization`, name: siteConfig.name, url: siteConfig.url },
        ]} />
      </div>
    );
  }

  if (category.slug === "image-tools") {
    const liveTools = list.filter((tool) => tool.status === "live");
    const pageUrl = absoluteUrl("/category/image-tools");
    const groupDescriptions: Record<string, string> = {
      image: "Resize, compress, batch-process, or convert photos and graphics.",
      animation: "Resize and edit animated GIFs or build a GIF from multiple images.",
      icon: "Inspect ICO files and create Windows icons or complete favicon packages.",
      color: "Sample colors from an image and copy useful HEX, RGB, HSL, or CSS values.",
    };

    return (
      <div className="mx-auto max-w-6xl space-y-14 px-4 py-6 sm:px-6 sm:py-10">
        <header className="space-y-5">
          <Breadcrumbs items={[{ name: "Image Tools", href: "/category/image-tools" }]} />
          <div className="rounded-2xl border bg-card px-5 py-8 sm:px-8 sm:py-10">
            <div className="flex items-start gap-4">
              <span className="hidden size-12 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground sm:flex"><ToolIcon name="image" className="size-6" /></span>
              <div className="max-w-3xl space-y-3">
                <p className="text-sm font-semibold text-primary">Free image tools · Process files in your browser</p>
                <h1 className="text-3xl font-bold tracking-tight text-balance sm:text-4xl">Free Online Image Tools to Resize, Compress and Convert</h1>
                <p className="text-base leading-relaxed text-muted-foreground sm:text-lg">Prepare images for websites, documents, social posts, forms, and apps. Resize one file or a batch, reduce file size, change formats, edit GIFs, build icons, and identify colors.</p>
                <ul className="flex flex-wrap gap-x-5 gap-y-2 pt-1 text-sm text-muted-foreground" aria-label="Image tool benefits">
                  {["Nine focused tools", "Batch processing available", "Phone and desktop friendly"].map((benefit) => <li key={benefit} className="flex items-center gap-1.5"><CheckCircle2 className="size-4 text-primary" aria-hidden /> {benefit}</li>)}
                </ul>
              </div>
            </div>
          </div>
        </header>

        <section aria-labelledby="image-tools-heading" className="space-y-8">
          <div className="max-w-3xl"><h2 id="image-tools-heading" className="text-2xl font-bold tracking-tight">Choose an image tool by task</h2><p className="mt-2 leading-relaxed text-muted-foreground">Each workspace is designed around a specific image job, with relevant dimensions, quality, format, or color controls.</p></div>
          {getImageToolsByGroup().map((group) => (
            <section key={group.id} aria-labelledby={`image-group-${group.id}`} className="space-y-4">
              <div><h2 id={`image-group-${group.id}`} className="text-xl font-semibold tracking-tight">{group.name}</h2><p className="mt-1 text-sm text-muted-foreground">{groupDescriptions[group.id]}</p></div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {group.tools.filter((tool) => tool.status === "live").map((tool) => (
                  <article key={tool.slug} className="flex h-full flex-col rounded-xl bg-card p-5 ring-1 ring-foreground/10 transition-shadow hover:shadow-md">
                    <span className="flex size-11 items-center justify-center rounded-lg bg-accent text-accent-foreground"><ToolIcon name={tool.icon} className="size-5" /></span>
                    <h3 className="mt-4 text-lg font-semibold">{tool.name}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{tool.shortDescription}</p>
                    {tool.features && <ul className="mt-3 flex-1 space-y-1.5 text-xs leading-relaxed text-muted-foreground">{tool.features.map((feature) => <li key={feature} className="flex gap-2"><CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-primary" aria-hidden />{feature}</li>)}</ul>}
                    <Link href={`/${tool.slug}`} className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-brand px-4 text-sm font-medium text-white shadow-sm shadow-blue-700/25 transition-[filter,box-shadow] hover:shadow-md hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">Use Tool <ArrowRight className="size-4" aria-hidden /></Link>
                  </article>
                ))}
              </div>
            </section>
          ))}
        </section>

        <section aria-labelledby="image-workflows-heading" className="space-y-5">
          <div className="max-w-3xl"><h2 id="image-workflows-heading" className="text-2xl font-bold tracking-tight">Common image workflows</h2><p className="mt-2 leading-relaxed text-muted-foreground">Choose dimensions first when both size and format matter, then compress or convert the result for its final destination.</p></div>
          <div className="grid gap-4 md:grid-cols-3">
            {[
              { title: "Prepare an image for upload", text: "Resize to the required pixel dimensions, then compress it to meet a KB or MB file-size limit.", links: [["Resize an image", "/image-resizer"], ["Compress an image", "/image-compressor"]] },
              { title: "Process a folder of images", text: "Apply consistent dimensions, output format, and compression settings to several files in one batch.", links: [["Open Bulk Image Resizer", "/bulk-image-resizer"], ["Convert one image", "/image-converter"]] },
              { title: "Create web and app assets", text: "Generate favicon sizes for a website, create a multi-size Windows ICO, or sample an exact brand color.", links: [["Generate favicons", "/favicon-generator"], ["Create an ICO", "/icon-converter"], ["Pick a color", "/color-picker"]] },
            ].map((workflow) => <article key={workflow.title} className="rounded-xl border bg-card p-5"><h3 className="font-semibold">{workflow.title}</h3><p className="mt-2 text-sm leading-relaxed text-muted-foreground">{workflow.text}</p><ul className="mt-4 space-y-2">{workflow.links.map(([label, href]) => <li key={href}><Link href={href} className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">{label} <ArrowRight className="size-3.5" aria-hidden /></Link></li>)}</ul></article>)}
          </div>
        </section>

        <section aria-labelledby="image-related-heading" className="space-y-5">
          <div><h2 id="image-related-heading" className="text-2xl font-bold tracking-tight">Related document and QR tools</h2><p className="mt-2 text-muted-foreground">Move between image and document formats or create a QR graphic for sharing information.</p></div>
          <div className="grid gap-4 sm:grid-cols-3">{IMAGE_RELATED_LINKS.map((item) => <Link key={item.href} href={item.href} className="group rounded-xl border bg-card p-5 transition-colors hover:border-primary/40"><h3 className="flex items-center gap-2 font-semibold">{item.name}<ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden /></h3><p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.text}</p></Link>)}</div>
          <p className="text-sm text-muted-foreground">Browse the full <Link href="/category/pdf-tools" className="font-medium text-primary hover:underline">PDF Tools</Link> collection, explore <Link href="/category/qr-security" className="font-medium text-primary hover:underline">QR &amp; Security Tools</Link>, or visit the <Link href="/tools" className="font-medium text-primary hover:underline">complete tool directory</Link>.</p>
        </section>

        <div className="max-w-3xl"><FaqSection faqs={IMAGE_FAQS} title="Image tools: frequently asked questions" /></div>
        <JsonLd data={[
          { "@context": "https://schema.org", "@type": "CollectionPage", "@id": `${pageUrl}#collection`, name: "Free Online Image Tools to Resize, Compress and Convert", description: IMAGE_DESCRIPTION, url: pageUrl, isPartOf: { "@id": `${siteConfig.url}#website` }, mainEntity: { "@id": `${pageUrl}#tool-list` } },
          { "@context": "https://schema.org", "@type": "ItemList", "@id": `${pageUrl}#tool-list`, name: "DailyKit online image tools", numberOfItems: liveTools.length, itemListElement: liveTools.map((tool, index) => ({ "@type": "ListItem", position: index + 1, name: tool.name, url: absoluteUrl(`/${tool.slug}`) })) },
          { "@context": "https://schema.org", "@type": "WebSite", "@id": `${siteConfig.url}#website`, name: siteConfig.name, url: siteConfig.url, publisher: { "@id": `${siteConfig.url}#organization` } },
          { "@context": "https://schema.org", "@type": "Organization", "@id": `${siteConfig.url}#organization`, name: siteConfig.name, url: siteConfig.url },
        ]} />
      </div>
    );
  }

  if (category.slug === "qr-security") {
    const liveTools = list.filter((tool) => tool.status === "live");
    const quickTools = liveTools.filter((tool) => tool.slug === "qr-code-generator" || tool.slug === "password-generator");
    const documentTools = liveTools.filter((tool) => !quickTools.includes(tool));
    const pageUrl = absoluteUrl("/category/qr-security");
    const renderCards = (items: typeof liveTools) => (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((tool) => (
          <article key={tool.slug} className="flex h-full flex-col rounded-xl bg-card p-5 ring-1 ring-foreground/10 transition-shadow hover:shadow-md">
            <span className="flex size-11 items-center justify-center rounded-lg bg-accent text-accent-foreground"><ToolIcon name={tool.icon} className="size-5" /></span>
            <h3 className="mt-4 text-lg font-semibold">{tool.name}</h3>
            <p className="mt-1 flex-1 text-sm leading-relaxed text-muted-foreground">{tool.shortDescription}</p>
            <Link href={`/${tool.slug}`} className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-brand px-4 text-sm font-medium text-white shadow-sm shadow-blue-700/25 transition-[filter,box-shadow] hover:shadow-md hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">Use Tool <ArrowRight className="size-4" aria-hidden /></Link>
          </article>
        ))}
      </div>
    );

    return (
      <div className="mx-auto max-w-6xl space-y-14 px-4 py-6 sm:px-6 sm:py-10">
        <header className="space-y-5">
          <Breadcrumbs items={[{ name: "QR & Security", href: "/category/qr-security" }]} />
          <div className="rounded-2xl border bg-card px-5 py-8 sm:px-8 sm:py-10">
            <div className="flex items-start gap-4">
              <span className="hidden size-12 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground sm:flex"><ToolIcon name="shield-check" className="size-6" /></span>
              <div className="max-w-3xl space-y-3">
                <p className="text-sm font-semibold text-primary">Free browser tools · QR, passwords and PDF security</p>
                <h1 className="text-3xl font-bold tracking-tight text-balance sm:text-4xl">Free QR Code Generator and Online Security Tools</h1>
                <p className="text-base leading-relaxed text-muted-foreground sm:text-lg">Create scannable QR codes, generate strong random passwords, and handle common PDF security tasks including signing, password protection, unlocking, and permanent redaction.</p>
                <ul className="flex flex-wrap gap-x-5 gap-y-2 pt-1 text-sm text-muted-foreground" aria-label="QR and security tool benefits">
                  {["Six focused tools", "Browser-based processing", "Phone and desktop friendly"].map((benefit) => <li key={benefit} className="flex items-center gap-1.5"><CheckCircle2 className="size-4 text-primary" aria-hidden /> {benefit}</li>)}
                </ul>
              </div>
            </div>
          </div>
        </header>

        <section aria-labelledby="qr-password-heading" className="space-y-5">
          <div className="max-w-3xl"><h2 id="qr-password-heading" className="text-2xl font-bold tracking-tight">QR code and password tools</h2><p className="mt-2 leading-relaxed text-muted-foreground">Create a QR code for sharing or payments, or generate a unique password with your preferred length and character options.</p></div>
          {renderCards(quickTools)}
        </section>

        <section aria-labelledby="document-security-heading" className="space-y-5">
          <div className="max-w-3xl"><h2 id="document-security-heading" className="text-2xl font-bold tracking-tight">PDF security and signing tools</h2><p className="mt-2 leading-relaxed text-muted-foreground">Control document access, place a signature, remove a known password from an authorized file, or permanently remove sensitive content before sharing.</p></div>
          {renderCards(documentTools)}
        </section>

        <section aria-labelledby="security-guidance-heading" className="space-y-5">
          <div className="max-w-3xl"><h2 id="security-guidance-heading" className="text-2xl font-bold tracking-tight">Use QR codes and document security safely</h2><p className="mt-2 leading-relaxed text-muted-foreground">A useful result still needs a quick human check. Test codes before distribution, keep passwords private, and inspect exported documents before sending them.</p></div>
          <div className="grid gap-4 md:grid-cols-3">
            {[
              { title: "Test every QR code", text: "Scan the final downloaded or printed code on multiple devices. Confirm that payment details, URLs, messages, and contact data are correct before publishing." },
              { title: "Use unique passwords", text: "Generate a different password for each account. Longer passwords are generally more resistant to guessing, especially when stored in a trusted password manager." },
              { title: "Review secured PDFs", text: "Open the exported file and verify its password, permissions, signature placement, or redaction. Keep an unmodified source copy when appropriate." },
            ].map((item) => <article key={item.title} className="rounded-xl border bg-card p-5"><h3 className="font-semibold">{item.title}</h3><p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.text}</p></article>)}
          </div>
        </section>

        <section aria-labelledby="security-related-heading" className="space-y-5">
          <div><h2 id="security-related-heading" className="text-2xl font-bold tracking-tight">Related communication and document tools</h2><p className="mt-2 text-muted-foreground">Prepare content and review documents before sharing, signing, or turning destinations into QR codes.</p></div>
          <div className="grid gap-4 sm:grid-cols-3">{SECURITY_RELATED_LINKS.map((item) => <Link key={item.href} href={item.href} className="group rounded-xl border bg-card p-5 transition-colors hover:border-primary/40"><h3 className="flex items-center gap-2 font-semibold">{item.name}<ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden /></h3><p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.text}</p></Link>)}</div>
          <p className="text-sm text-muted-foreground">Browse all <Link href="/category/pdf-tools" className="font-medium text-primary hover:underline">PDF Tools</Link>, explore <Link href="/category/communication" className="font-medium text-primary hover:underline">Communication Tools</Link>, or visit the <Link href="/tools" className="font-medium text-primary hover:underline">complete tool directory</Link>.</p>
        </section>

        <div className="max-w-3xl"><FaqSection faqs={SECURITY_FAQS} title="QR and security tools: frequently asked questions" /></div>
        <JsonLd data={[
          { "@context": "https://schema.org", "@type": "CollectionPage", "@id": `${pageUrl}#collection`, name: "Free QR Code Generator and Online Security Tools", description: SECURITY_DESCRIPTION, url: pageUrl, isPartOf: { "@id": `${siteConfig.url}#website` }, mainEntity: { "@id": `${pageUrl}#tool-list` } },
          { "@context": "https://schema.org", "@type": "ItemList", "@id": `${pageUrl}#tool-list`, name: "DailyKit QR and security tools", numberOfItems: liveTools.length, itemListElement: liveTools.map((tool, index) => ({ "@type": "ListItem", position: index + 1, name: tool.name, url: absoluteUrl(`/${tool.slug}`) })) },
          { "@context": "https://schema.org", "@type": "WebSite", "@id": `${siteConfig.url}#website`, name: siteConfig.name, url: siteConfig.url, publisher: { "@id": `${siteConfig.url}#organization` } },
          { "@context": "https://schema.org", "@type": "Organization", "@id": `${siteConfig.url}#organization`, name: siteConfig.name, url: siteConfig.url },
        ]} />
      </div>
    );
  }

  if (category.slug === "productivity") {
    const liveTools = list.filter((tool) => tool.status === "live");
    const pageUrl = absoluteUrl("/category/productivity");

    return (
      <div className="mx-auto max-w-6xl space-y-14 px-4 py-6 sm:px-6 sm:py-10">
        <header className="space-y-5">
          <Breadcrumbs items={[{ name: "Productivity", href: "/category/productivity" }]} />
          <div className="rounded-2xl border bg-card px-5 py-8 sm:px-8 sm:py-10">
            <div className="flex items-start gap-4">
              <span className="hidden size-12 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground sm:flex"><ToolIcon name="list-todo" className="size-6" /></span>
              <div className="max-w-3xl space-y-3">
                <p className="text-sm font-semibold text-primary">Simple daily tools · Plan, record and calculate</p>
                <h1 className="text-3xl font-bold tracking-tight text-balance sm:text-4xl">Free Online Productivity Tools for Daily Work</h1>
                <p className="text-base leading-relaxed text-muted-foreground sm:text-lg">Keep tasks visible, record everyday expenses, and answer date-based questions without a complicated workspace. These focused tools support personal routines, freelance work, and small-business administration.</p>
                <ul className="flex flex-wrap gap-x-5 gap-y-2 pt-1 text-sm text-muted-foreground" aria-label="Productivity tool benefits">
                  {["Three focused tools", "Clear mobile controls", "Useful for work and home"].map((benefit) => <li key={benefit} className="flex items-center gap-1.5"><CheckCircle2 className="size-4 text-primary" aria-hidden /> {benefit}</li>)}
                </ul>
              </div>
            </div>
          </div>
        </header>

        <section aria-labelledby="productivity-tools-heading" className="space-y-5">
          <div className="max-w-3xl"><h2 id="productivity-tools-heading" className="text-2xl font-bold tracking-tight">Choose a productivity tool</h2><p className="mt-2 leading-relaxed text-muted-foreground">Select the job you need to complete: plan what comes next, record where money went, or calculate an exact age and birthday countdown.</p></div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {liveTools.map((tool) => (
              <article key={tool.slug} className="flex h-full flex-col rounded-xl bg-card p-5 ring-1 ring-foreground/10 transition-shadow hover:shadow-md">
                <span className="flex size-11 items-center justify-center rounded-lg bg-accent text-accent-foreground"><ToolIcon name={tool.icon} className="size-5" /></span>
                <h3 className="mt-4 text-lg font-semibold">{tool.name}</h3>
                <p className="mt-1 flex-1 text-sm leading-relaxed text-muted-foreground">{tool.shortDescription}</p>
                <Link href={`/${tool.slug}`} className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-brand px-4 text-sm font-medium text-white shadow-sm shadow-blue-700/25 transition-[filter,box-shadow] hover:shadow-md hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">Use Tool <ArrowRight className="size-4" aria-hidden /></Link>
              </article>
            ))}
          </div>
        </section>

        <section aria-labelledby="productive-routine-heading" className="space-y-5">
          <div className="max-w-3xl"><h2 id="productive-routine-heading" className="text-2xl font-bold tracking-tight">Build a simple daily routine</h2><p className="mt-2 leading-relaxed text-muted-foreground">A lightweight routine can make daily work easier to review without turning planning into another large project.</p></div>
          <ol className="grid gap-4 md:grid-cols-3">
            {[
              { step: "1", title: "Plan important work", text: "Add clear tasks, choose priorities, and set realistic due dates. Use reminders as support, with a backup for critical deadlines.", href: "/task-manager", link: "Open Task Manager" },
              { step: "2", title: "Record expenses promptly", text: "Log purchases while details are fresh, choose consistent categories, and review reports for spending patterns.", href: "/expense-tracker", link: "Track an expense" },
              { step: "3", title: "Check dates accurately", text: "Calculate exact age on a chosen date or find the remaining time until the next birthday for forms and planning.", href: "/age-calculator", link: "Calculate an age" },
            ].map((item) => <li key={item.step} className="rounded-xl border bg-card p-5"><span className="flex size-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground" aria-hidden>{item.step}</span><h3 className="mt-4 font-semibold">{item.title}</h3><p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.text}</p><Link href={item.href} className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">{item.link} <ArrowRight className="size-3.5" aria-hidden /></Link></li>)}
          </ol>
        </section>

        <section aria-labelledby="productivity-related-heading" className="space-y-5">
          <div><h2 id="productivity-related-heading" className="text-2xl font-bold tracking-tight">Related tools for everyday work</h2><p className="mt-2 text-muted-foreground">Continue from planning and records to customer documents, messages, or quick calculations.</p></div>
          <div className="grid gap-4 sm:grid-cols-3">{PRODUCTIVITY_RELATED_LINKS.map((item) => <Link key={item.href} href={item.href} className="group rounded-xl border bg-card p-5 transition-colors hover:border-primary/40"><h3 className="flex items-center gap-2 font-semibold">{item.name}<ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden /></h3><p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.text}</p></Link>)}</div>
          <p className="text-sm text-muted-foreground">Browse more in <Link href="/category/business-tools" className="font-medium text-primary hover:underline">Business Tools</Link>, <Link href="/category/calculators" className="font-medium text-primary hover:underline">Online Calculators</Link>, or the <Link href="/tools" className="font-medium text-primary hover:underline">complete tool directory</Link>.</p>
        </section>

        <div className="max-w-3xl"><FaqSection faqs={PRODUCTIVITY_FAQS} title="Productivity tools: frequently asked questions" /></div>
        <JsonLd data={[
          { "@context": "https://schema.org", "@type": "CollectionPage", "@id": `${pageUrl}#collection`, name: "Free Online Productivity Tools for Daily Work", description: PRODUCTIVITY_DESCRIPTION, url: pageUrl, isPartOf: { "@id": `${siteConfig.url}#website` }, mainEntity: { "@id": `${pageUrl}#tool-list` } },
          { "@context": "https://schema.org", "@type": "ItemList", "@id": `${pageUrl}#tool-list`, name: "DailyKit productivity tools", numberOfItems: liveTools.length, itemListElement: liveTools.map((tool, index) => ({ "@type": "ListItem", position: index + 1, name: tool.name, url: absoluteUrl(`/${tool.slug}`) })) },
          { "@context": "https://schema.org", "@type": "WebSite", "@id": `${siteConfig.url}#website`, name: siteConfig.name, url: siteConfig.url, publisher: { "@id": `${siteConfig.url}#organization` } },
          { "@context": "https://schema.org", "@type": "Organization", "@id": `${siteConfig.url}#organization`, name: siteConfig.name, url: siteConfig.url },
        ]} />
      </div>
    );
  }

  if (category.slug === "font-converters") {
    const liveTools = list.filter((tool) => tool.status === "live");
    const pageUrl = absoluteUrl("/category/font-converters");

    return (
      <div className="mx-auto max-w-6xl space-y-14 px-4 py-6 sm:px-6 sm:py-10">
        <header className="space-y-5">
          <Breadcrumbs items={[{ name: "Font Converters", href: "/category/font-converters" }]} />
          <div className="rounded-2xl border bg-card px-5 py-8 sm:px-8 sm:py-10">
            <div className="flex items-start gap-4">
              <span className="hidden size-12 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground sm:flex"><ToolIcon name="type" className="size-6" /></span>
              <div className="max-w-3xl space-y-3">
                <p className="text-sm font-semibold text-primary">Unicode and legacy text conversion · Multiple Indian languages</p>
                <h1 className="text-3xl font-bold tracking-tight text-balance sm:text-4xl">Free Unicode and Legacy Font Converters</h1>
                <p className="text-base leading-relaxed text-muted-foreground sm:text-lg">Convert text between Unicode and supported legacy font encodings used in Hindi, Marathi, Gujarati, Punjabi, Bangla, Tamil, Kannada, Malayalam, and Nepali documents. Additional tools cover Roman text, Braille, and UK–US English spelling.</p>
                <ul className="flex flex-wrap gap-x-5 gap-y-2 pt-1 text-sm text-muted-foreground" aria-label="Font converter benefits">
                  {[`${liveTools.length} live converters`, "Browser-based conversion", "Copy and download results"].map((benefit) => <li key={benefit} className="flex items-center gap-1.5"><CheckCircle2 className="size-4 text-primary" aria-hidden /> {benefit}</li>)}
                </ul>
              </div>
            </div>
          </div>
        </header>

        <section aria-labelledby="font-converters-heading" className="space-y-8">
          <div className="max-w-3xl"><h2 id="font-converters-heading" className="text-2xl font-bold tracking-tight">Choose a font converter by language</h2><p className="mt-2 leading-relaxed text-muted-foreground">Select the exact source and destination format. Legacy fonts use different character mappings, so a converter for one font family should not be used for another.</p></div>
          {getFontConvertersByGroup().map((group) => {
            const groupTools = group.tools.filter((tool) => tool.status === "live");
            if (groupTools.length === 0) return null;
            return (
              <section key={group.id} aria-labelledby={`font-group-${group.id}`} className="space-y-4">
                <h2 id={`font-group-${group.id}`} className="text-xl font-semibold tracking-tight">{group.name} font converters</h2>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {groupTools.map((tool) => (
                    <article key={tool.slug} className="flex h-full flex-col rounded-xl bg-card p-5 ring-1 ring-foreground/10 transition-shadow hover:shadow-md">
                      <span className="flex size-11 items-center justify-center rounded-lg bg-accent text-accent-foreground"><ToolIcon name={tool.icon} className="size-5" /></span>
                      <h3 className="mt-4 font-semibold">{tool.name}</h3>
                      <p className="mt-1 flex-1 text-sm leading-relaxed text-muted-foreground">{tool.shortDescription}</p>
                      <Link href={`/${tool.slug}`} className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-brand px-4 text-sm font-medium text-white shadow-sm shadow-blue-700/25 transition-[filter,box-shadow] hover:shadow-md hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">Use Tool <ArrowRight className="size-4" aria-hidden /></Link>
                    </article>
                  ))}
                </div>
              </section>
            );
          })}
        </section>

        <section aria-labelledby="font-how-heading" className="space-y-5">
          <div className="max-w-3xl"><h2 id="font-how-heading" className="text-2xl font-bold tracking-tight">How to convert legacy font text correctly</h2><p className="mt-2 leading-relaxed text-muted-foreground">Correctly identifying the source font is the most important step. Two documents can look similar while storing entirely different character sequences.</p></div>
          <ol className="grid gap-4 md:grid-cols-3">
            {[
              { step: "1", title: "Identify the source format", text: "Check the original document, font menu, or sender's instructions. Choose the converter whose source name matches the text encoding." },
              { step: "2", title: "Paste and convert", text: "Paste plain text into the source field and run the conversion. Avoid mixing text from different legacy fonts in the same batch." },
              { step: "3", title: "Proofread the result", text: "Review names, numbers, punctuation, conjuncts, and line breaks. Copy or download the corrected text for use in a Unicode-compatible app." },
            ].map((item) => <li key={item.step} className="rounded-xl border bg-card p-5"><span className="flex size-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground" aria-hidden>{item.step}</span><h3 className="mt-4 font-semibold">{item.title}</h3><p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.text}</p></li>)}
          </ol>
        </section>

        <section aria-labelledby="font-related-heading" className="space-y-5">
          <div><h2 id="font-related-heading" className="text-2xl font-bold tracking-tight">Related typing and document tools</h2><p className="mt-2 text-muted-foreground">Type fresh Unicode text or extract searchable text from a scanned document before reviewing and converting it.</p></div>
          <div className="grid gap-4 sm:grid-cols-3">{FONT_RELATED_LINKS.map((item) => <Link key={item.href} href={item.href} className="group rounded-xl border bg-card p-5 transition-colors hover:border-primary/40"><h3 className="flex items-center gap-2 font-semibold">{item.name}<ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden /></h3><p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.text}</p></Link>)}</div>
          <p className="text-sm text-muted-foreground">Browse all <Link href="/category/typing-tools" className="font-medium text-primary hover:underline">Typing Tools</Link>, explore <Link href="/category/pdf-tools" className="font-medium text-primary hover:underline">PDF Tools</Link>, or visit the <Link href="/tools" className="font-medium text-primary hover:underline">complete tool directory</Link>.</p>
        </section>

        <div className="max-w-3xl"><FaqSection faqs={FONT_FAQS} title="Font converters: frequently asked questions" /></div>
        <JsonLd data={[
          { "@context": "https://schema.org", "@type": "CollectionPage", "@id": `${pageUrl}#collection`, name: "Free Unicode and Legacy Font Converters", description: FONT_DESCRIPTION, url: pageUrl, isPartOf: { "@id": `${siteConfig.url}#website` }, mainEntity: { "@id": `${pageUrl}#tool-list` } },
          { "@context": "https://schema.org", "@type": "ItemList", "@id": `${pageUrl}#tool-list`, name: "DailyKit Unicode and legacy font converters", numberOfItems: liveTools.length, itemListElement: liveTools.map((tool, index) => ({ "@type": "ListItem", position: index + 1, name: tool.name, url: absoluteUrl(`/${tool.slug}`) })) },
          { "@context": "https://schema.org", "@type": "WebSite", "@id": `${siteConfig.url}#website`, name: siteConfig.name, url: siteConfig.url, publisher: { "@id": `${siteConfig.url}#organization` } },
          { "@context": "https://schema.org", "@type": "Organization", "@id": `${siteConfig.url}#organization`, name: siteConfig.name, url: siteConfig.url },
        ]} />
      </div>
    );
  }

  if (category.slug === "typing-tools") {
    const liveTools = list.filter((tool) => tool.status === "live");
    const pageUrl = absoluteUrl("/category/typing-tools");

    return (
      <div className="mx-auto max-w-6xl space-y-14 px-4 py-6 sm:px-6 sm:py-10">
        <header className="space-y-5">
          <Breadcrumbs items={[{ name: "Typing Tools", href: "/category/typing-tools" }]} />
          <div className="rounded-2xl border bg-card px-5 py-8 sm:px-8 sm:py-10">
            <div className="flex items-start gap-4">
              <span className="hidden size-12 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground sm:flex"><ToolIcon name="languages" className="size-6" /></span>
              <div className="max-w-3xl space-y-3">
                <p className="text-sm font-semibold text-primary">Free online keyboards · No software installation</p>
                <h1 className="text-3xl font-bold tracking-tight text-balance sm:text-4xl">Free Online Keyboards for Indian and World Languages</h1>
                <p className="text-base leading-relaxed text-muted-foreground sm:text-lg">Type and format text in Hindi, Marathi, Bengali, Tamil, Urdu, and many other languages using an on-screen keyboard or supported physical-key layout. Copy, print, or download the finished text from your browser.</p>
                <ul className="flex flex-wrap gap-x-5 gap-y-2 pt-1 text-sm text-muted-foreground" aria-label="Online keyboard benefits">
                  {[`${liveTools.length} keyboard tools`, "Unicode text output", "Phone and desktop friendly"].map((benefit) => <li key={benefit} className="flex items-center gap-1.5"><CheckCircle2 className="size-4 text-primary" aria-hidden /> {benefit}</li>)}
                </ul>
              </div>
            </div>
          </div>
        </header>

        <section aria-labelledby="typing-tools-heading" className="space-y-8">
          <div className="max-w-3xl"><h2 id="typing-tools-heading" className="text-2xl font-bold tracking-tight">Choose an online language keyboard</h2><p className="mt-2 leading-relaxed text-muted-foreground">Keyboards are grouped by language region. Open the layout that matches your language or required typing system.</p></div>
          {getTypingToolsByGroup().map((group) => (
            <section key={group.id} aria-labelledby={`typing-group-${group.id}`} className="space-y-4">
              <div><h2 id={`typing-group-${group.id}`} className="text-xl font-semibold tracking-tight">{group.name}</h2><p className="mt-1 text-sm text-muted-foreground">{group.id === "indian" ? "Type Indian scripts with language-specific Unicode and legacy keyboard layouts." : "Type selected international languages with the appropriate script direction and key layout."}</p></div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {group.tools.filter((tool) => tool.status === "live").map((tool) => (
                  <article key={tool.slug} className="flex h-full flex-col rounded-xl bg-card p-5 ring-1 ring-foreground/10 transition-shadow hover:shadow-md">
                    <span className="flex size-11 items-center justify-center rounded-lg bg-accent text-accent-foreground"><ToolIcon name={tool.icon} className="size-5" /></span>
                    <h3 className="mt-4 font-semibold">{tool.name}</h3>
                    <p className="mt-1 flex-1 text-sm leading-relaxed text-muted-foreground">{tool.shortDescription}</p>
                    <Link href={`/${tool.slug}`} className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-brand px-4 text-sm font-medium text-white shadow-sm shadow-blue-700/25 transition-[filter,box-shadow] hover:shadow-md hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">Use Tool <ArrowRight className="size-4" aria-hidden /></Link>
                  </article>
                ))}
              </div>
            </section>
          ))}
        </section>

        <section aria-labelledby="typing-how-heading" className="space-y-5">
          <div className="max-w-3xl"><h2 id="typing-how-heading" className="text-2xl font-bold tracking-tight">How to type and reuse multilingual text</h2><p className="mt-2 leading-relaxed text-muted-foreground">Most keyboards produce Unicode text that can move between modern websites and apps. The Kruti Dev keyboard is a legacy-font exception.</p></div>
          <div className="grid gap-4 md:grid-cols-3">
            {[
              { title: "Choose the right layout", text: "Select your language and, where offered, the expected layout such as Mangal/InScript, Remington, or Kruti Dev." },
              { title: "Type and format", text: "Use your physical keyboard or tap the on-screen keys. Review script direction, punctuation, conjuncts, and spacing as you work." },
              { title: "Copy or download", text: "Copy Unicode text into email, messages, forms, and documents, or print and download it before leaving the workspace." },
            ].map((item) => <article key={item.title} className="rounded-xl border bg-card p-5"><h3 className="font-semibold">{item.title}</h3><p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.text}</p></article>)}
          </div>
        </section>

        <section aria-labelledby="typing-related-heading" className="space-y-5">
          <div><h2 id="typing-related-heading" className="text-2xl font-bold tracking-tight">Related font conversion and messaging tools</h2><p className="mt-2 text-muted-foreground">Convert older font-encoded text or prepare multilingual content for customer communication.</p></div>
          <div className="grid gap-4 sm:grid-cols-3">{TYPING_RELATED_LINKS.map((item) => <Link key={item.href} href={item.href} className="group rounded-xl border bg-card p-5 transition-colors hover:border-primary/40"><h3 className="flex items-center gap-2 font-semibold">{item.name}<ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden /></h3><p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.text}</p></Link>)}</div>
          <p className="text-sm text-muted-foreground">Browse all <Link href="/category/font-converters" className="font-medium text-primary hover:underline">Font Converters</Link>, explore <Link href="/category/communication" className="font-medium text-primary hover:underline">Communication Tools</Link>, or visit the <Link href="/tools" className="font-medium text-primary hover:underline">complete tool directory</Link>.</p>
        </section>

        <div className="max-w-3xl"><FaqSection faqs={TYPING_FAQS} title="Online keyboards: frequently asked questions" /></div>
        <JsonLd data={[
          { "@context": "https://schema.org", "@type": "CollectionPage", "@id": `${pageUrl}#collection`, name: "Free Online Keyboards for Indian and World Languages", description: TYPING_DESCRIPTION, url: pageUrl, isPartOf: { "@id": `${siteConfig.url}#website` }, mainEntity: { "@id": `${pageUrl}#tool-list` } },
          { "@context": "https://schema.org", "@type": "ItemList", "@id": `${pageUrl}#tool-list`, name: "DailyKit online language keyboards", numberOfItems: liveTools.length, itemListElement: liveTools.map((tool, index) => ({ "@type": "ListItem", position: index + 1, name: tool.name, url: absoluteUrl(`/${tool.slug}`) })) },
          { "@context": "https://schema.org", "@type": "WebSite", "@id": `${siteConfig.url}#website`, name: siteConfig.name, url: siteConfig.url, publisher: { "@id": `${siteConfig.url}#organization` } },
          { "@context": "https://schema.org", "@type": "Organization", "@id": `${siteConfig.url}#organization`, name: siteConfig.name, url: siteConfig.url },
        ]} />
      </div>
    );
  }

  if (seo) {
    const liveTools = list.filter((tool) => tool.status === "live");
    const pageUrl = absoluteUrl(`/category/${category.slug}`);
    const sections = getToolSections(category.slug);
    return (
      <div className="mx-auto max-w-6xl space-y-12 px-4 py-6 sm:px-6 sm:py-10">
        <header className="space-y-5">
          <Breadcrumbs items={[{ name: category.name, href: `/category/${category.slug}` }]} />
          <div className="rounded-2xl border bg-card px-5 py-8 sm:px-8 sm:py-10">
            <div className="flex items-start gap-4">
              <span className="hidden size-12 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground sm:flex"><ToolIcon name={category.icon} className="size-6" /></span>
              <div className="max-w-3xl space-y-3">
                <p className="text-sm font-semibold text-primary">Free browser-based utilities</p>
                <h1 className="text-3xl font-bold tracking-tight text-balance sm:text-4xl">{seo.heading}</h1>
                <p className="text-base leading-relaxed text-muted-foreground sm:text-lg">{seo.introduction}</p>
                <p className="text-sm text-muted-foreground">{liveTools.length} tools available · Mobile and desktop friendly</p>
              </div>
            </div>
          </div>
        </header>

        <section aria-labelledby="category-tools-heading" className="space-y-7">
          <div className="max-w-3xl"><h2 id="category-tools-heading" className="text-2xl font-bold tracking-tight">Choose a {category.name.toLowerCase().replace(/ tools$/, "")} tool</h2><p className="mt-2 leading-relaxed text-muted-foreground">Open a focused tool below, enter your information and review the result in your browser.</p></div>
          {sections.length > 1 ? sections.map((section) => (
            <section key={section.name} aria-labelledby={`section-${section.name}`} className="space-y-4">
              <h3 id={`section-${section.name}`} className="text-xl font-semibold tracking-tight">{section.name}</h3>
              <CategoryTools tools={section.tools} />
            </section>
          )) : <CategoryTools tools={list} />}
        </section>

        <section aria-labelledby="category-guide-heading" className="space-y-5">
          <h2 id="category-guide-heading" className="text-2xl font-bold tracking-tight">{seo.guideTitle}</h2>
          <div className="grid gap-4 md:grid-cols-3">
            {seo.guide.map((item) => <article key={item.title} className="rounded-xl border bg-card p-5"><h3 className="font-semibold">{item.title}</h3><p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.text}</p></article>)}
          </div>
        </section>

        <section aria-labelledby="category-related-heading" className="space-y-5">
          <h2 id="category-related-heading" className="text-2xl font-bold tracking-tight">Related tools and categories</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {seo.related.map((item) => <Link key={item.href} href={item.href} className="group rounded-xl border bg-card p-5 transition-colors hover:border-primary/40"><h3 className="flex items-center gap-2 font-semibold">{item.name}<ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden /></h3><p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.text}</p></Link>)}
          </div>
          <p className="text-sm text-muted-foreground">You can also browse the <Link href="/tools" className="font-medium text-primary hover:underline">complete tool directory</Link>.</p>
        </section>

        <div className="max-w-3xl"><FaqSection faqs={seo.faqs} title={`${category.name}: frequently asked questions`} /></div>
        <JsonLd data={[
          { "@context": "https://schema.org", "@type": "CollectionPage", "@id": `${pageUrl}#collection`, name: seo.heading, description: seo.description, url: pageUrl, isPartOf: { "@id": `${siteConfig.url}#website` }, mainEntity: { "@id": `${pageUrl}#tool-list` } },
          { "@context": "https://schema.org", "@type": "ItemList", "@id": `${pageUrl}#tool-list`, name: `${category.name} on ${siteConfig.name}`, numberOfItems: liveTools.length, itemListElement: liveTools.map((tool, index) => ({ "@type": "ListItem", position: index + 1, name: tool.name, url: absoluteUrl(`/${tool.slug}`) })) },
        ]} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-6 sm:px-6 sm:py-10">
      <header className="space-y-4">
        <Breadcrumbs items={[{ name: category.name, href: `/category/${category.slug}` }]} />
        <div className="flex items-start gap-4">
          <span className="hidden size-12 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground sm:flex">
            <ToolIcon name={category.icon} className="size-6" />
          </span>
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">{category.name}</h1>
            <p className="max-w-2xl text-muted-foreground">{category.description}</p>
          </div>
        </div>
      </header>
      {(() => {
        // Categories with sections (such as Developer Tools) show a heading per section.
        const sections = getToolSections(category.slug);
        if (sections.length < 2) return <CategoryTools tools={list} />;
        return sections.map((section) => (
          <section key={section.name} aria-labelledby={`section-${section.name}`} className="space-y-4">
            <h2 id={`section-${section.name}`} className="text-xl font-semibold tracking-tight">{section.name}</h2>
            <CategoryTools tools={section.tools} />
          </section>
        ));
      })()}
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: category.name,
          description: category.description,
          url: absoluteUrl(`/category/${category.slug}`),
          hasPart: list
            .filter((t) => t.status === "live")
            .map((t) => ({ "@type": "WebApplication", name: t.name, url: absoluteUrl(`/${t.slug}`) })),
        }}
      />
    </div>
  );
}
