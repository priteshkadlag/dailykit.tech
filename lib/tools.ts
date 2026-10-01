import { FONT_CONVERTER_GROUPS, fontConverterTools, type FontConverterGroup } from "@/lib/font-converters/registry";
import { keyboardTools } from "@/lib/keyboard-data";
import { DEV_EXTRAS, DEV_GROUPS, devToolEntries, type DevGroup, type DevIcon } from "@/lib/dev-tools/registry";

/**
 * Single source of truth for every tool and category on the platform.
 * Navigation, the tool directory, search, the sitemap and related-tool
 * lists are all derived from this file — adding a tool starts here.
 */

export type CategorySlug =
  | "business-tools"
  | "finance-tools"
  | "calculators"
  | "pdf-tools"
  | "image-tools"
  | "typing-tools"
  | "font-converters"
  | "productivity"
  | "qr-security"
  | "communication"
  | "text-tools"
  | "health-fitness"
  | "real-estate-tools"
  | "creator-tools"
  | "developer-tools";

export type IconName =
  | "receipt"
  | "file-text"
  | "trending-up"
  | "truck"
  | "wallet"
  | "landmark"
  | "percent"
  | "badge-percent"
  | "calculator"
  | "file-image"
  | "images"
  | "scaling"
  | "image-down"
  | "list-todo"
  | "cake"
  | "qr-code"
  | "key-round"
  | "message-circle"
  | "briefcase"
  | "file-stack"
  | "image"
  | "shield-check"
  | "merge"
  | "split"
  | "file-minus"
  | "file-output"
  | "layout-grid"
  | "scan-line"
  | "minimize"
  | "wrench"
  | "scan-text"
  | "file-type"
  | "presentation"
  | "file-spreadsheet"
  | "code"
  | "file-check"
  | "rotate-cw"
  | "list-ordered"
  | "stamp"
  | "crop"
  | "pencil-line"
  | "clipboard-list"
  | "lock-open"
  | "lock"
  | "signature"
  | "eye-off"
  | "git-compare"
  | "sparkles"
  | "languages"
  | "file-code"
  | "type"
  | "video"
  | "ratio"
  | "list-video"
  | "car"
  | "graduation-cap"
  | "calendar-range"
  | "coins"
  | "ferris-wheel"
  | "mic"
  | "piggy-bank"
  | "house"
  | "hand-coins"
  | "receipt-indian-rupee"
  | "chart-line"
  | DevIcon;

/** Sections of the PDF category, in the order they're shown. */
export const PDF_GROUPS = [
  { id: "organize", name: "Organize PDF" },
  { id: "optimize", name: "Optimize PDF" },
  { id: "convert-to", name: "Convert to PDF" },
  { id: "convert-from", name: "Convert from PDF" },
  { id: "edit", name: "Edit PDF" },
  { id: "security", name: "PDF Security" },
  { id: "intelligence", name: "PDF Intelligence" },
] as const;
export type PdfGroup = (typeof PDF_GROUPS)[number]["id"];
export const IMAGE_GROUPS = [
  { id: "image", name: "Image Tools" },
  { id: "animation", name: "Animation Tools" },
  { id: "icon", name: "Icon Tools" },
  { id: "color", name: "Color Tools" },
] as const;
export type ImageGroup = (typeof IMAGE_GROUPS)[number]["id"];
export const TYPING_GROUPS = [
  { id: "indian", name: "Indian Languages" },
  { id: "international", name: "International Languages" },
] as const;
export type TypingGroup = (typeof TYPING_GROUPS)[number]["id"];

export interface Category {
  slug: CategorySlug;
  name: string;
  description: string;
  icon: IconName;
}

export interface Tool {
  slug: string;
  name: string;
  shortDescription: string;
  /** First category is the primary one (used for breadcrumbs). */
  categories: CategorySlug[];
  keywords: string[];
  icon: IconName;
  status: "live" | "coming-soon";
  popular?: boolean;
  /** Section within the PDF, image or typing category. */
  group?: PdfGroup | ImageGroup | TypingGroup | FontConverterGroup | DevGroup;
  /** Extra capabilities shown on richer category cards. */
  features?: string[];
  /** Deep links into a specific mode of a tool, surfaced by search. */
  shortcuts?: { name: string; hash: string; keywords: string[] }[];
}

export const categories: Category[] = [
  {
    slug: "business-tools",
    name: "Business Tools",
    description: "Invoices, quotations, margins and shipping — the daily paperwork of running a shop or business.",
    icon: "briefcase",
  },
  {
    slug: "finance-tools",
    name: "Finance Tools",
    description: "Income tax, HRA, EPF, gratuity, GST, EMI, SIP and mutual fund calculators — Indian rules, worked out instantly.",
    icon: "landmark",
  },
  {
    slug: "calculators",
    name: "Calculators",
    description: "Every calculator on the platform in one place.",
    icon: "calculator",
  },
  {
    slug: "pdf-tools",
    name: "PDF Tools",
    description: "Merge, split, compress, edit, sign, protect and convert PDFs — all in your browser, nothing uploaded.",
    icon: "file-stack",
  },
  {
    slug: "image-tools",
    name: "Image Tools",
    description: "Resize and compress photos for social media, websites and documents.",
    icon: "image",
  },
  {
    slug: "typing-tools",
    name: "Typing Tools",
    description: "Online keyboards for Hindi, Marathi, Tamil, Urdu and 20+ more Indian and world languages — type, format, copy, print or download, no software needed.",
    icon: "languages",
  },
  {
    slug: "font-converters",
    name: "Font Converters",
    description: "Convert Hindi, Marathi, Nepali, Gujarati, Tamil, Kannada, Malayalam, Punjabi and Bangla text between Unicode and legacy fonts like Kruti Dev, Chanakya, Shree Lipi, Shivaji, Preeti, LMG Arun, Gujarati Lys, Bamini, STMZH, Nudi and Bijoy — plus Braille, Hindi to Roman and UK ⇄ US English.",
    icon: "type",
  },
  {
    slug: "productivity",
    name: "Productivity",
    description: "Tasks, timers, date and time calculators, time zones, and random pickers to keep your day organised.",
    icon: "list-todo",
  },
  {
    slug: "qr-security",
    name: "QR & Security",
    description: "QR codes for UPI, WiFi and links, plus strong password generation.",
    icon: "shield-check",
  },
  {
    slug: "communication",
    name: "Communication",
    description: "Ready-to-send WhatsApp messages and click-to-chat links for customers, orders and wishes.",
    icon: "message-circle",
  },
  {
    slug: "text-tools",
    name: "Text & Content Tools",
    description: "Count, transform, generate and format text for writing, design, SEO and social media.",
    icon: "file-text",
  },
  {
    slug: "health-fitness",
    name: "Health & Fitness Calculators",
    description: "Estimate daily energy, balanced macros, pregnancy dates and strength-training benchmarks.",
    icon: "calculator",
  },
  {
    slug: "real-estate-tools",
    name: "Real Estate & Mortgage Tools",
    description: "Compare housing costs, refinancing break-even periods and estimated FHA mortgage payments.",
    icon: "landmark",
  },
  {
    slug: "creator-tools",
    name: "Creator & Streaming Tools",
    description: "Quick utilities for streamers, YouTubers and video editors: OBS bitrate settings, aspect-ratio crops and YouTube chapter timestamps.",
    icon: "video",
  },
  {
    slug: "developer-tools",
    name: "Developer Tools",
    description: "Formatters, minifiers, encoders, generators, converters and web utilities for developers — JSON, Base64, JWT, regex, cron, hashes, colors and more, all in your browser.",
    icon: "code",
  },
];

export const tools: Tool[] = ([
  // ---- Live ----
  {
    slug: "gst-calculator",
    name: "GST Calculator",
    shortDescription: "Add or remove GST from any amount with CGST, SGST and IGST split.",
    categories: ["finance-tools", "calculators"],
    keywords: ["gst", "tax", "cgst", "sgst", "igst", "inclusive", "exclusive", "hsn", "invoice tax"],
    icon: "percent",
    status: "live",
    popular: true,
    shortcuts: [
      { name: "GST Inclusive Calculator", hash: "inclusive", keywords: ["gst", "inclusive", "remove gst", "reverse gst"] },
      { name: "GST Exclusive Calculator", hash: "exclusive", keywords: ["gst", "exclusive", "add gst"] },
    ],
  },
  {
    slug: "emi-calculator",
    name: "EMI Calculator",
    shortDescription: "Monthly EMI, total interest and a full amortization schedule for any loan.",
    categories: ["finance-tools", "calculators"],
    keywords: ["emi", "loan", "home loan", "car loan", "personal loan", "interest", "amortization"],
    icon: "landmark",
    status: "live",
    popular: true,
  },
  {
    slug: "percentage-calculator",
    name: "Percentage Calculator",
    shortDescription: "X% of Y, percentage of a total, and percentage increase or decrease.",
    categories: ["finance-tools", "calculators"],
    keywords: ["percentage", "percent", "%", "increase", "decrease", "change", "ratio"],
    icon: "calculator",
    status: "live",
    popular: true,
    shortcuts: [
      { name: "Percentage Increase / Decrease", hash: "change", keywords: ["percentage increase", "percentage decrease", "growth", "change"] },
    ],
  },
  {
    slug: "discount-calculator",
    name: "Discount Calculator",
    shortDescription: "Final price after single, multiple or discount-plus-GST offers.",
    categories: ["finance-tools", "calculators"],
    keywords: ["discount", "sale", "offer", "off", "price", "mrp", "gst", "successive discount"],
    icon: "badge-percent",
    status: "live",
    popular: true,
    shortcuts: [
      { name: "Discount + GST Calculator", hash: "gst", keywords: ["gst", "discount gst", "price with gst"] },
      { name: "Multiple Discount Calculator", hash: "multiple", keywords: ["multiple discount", "successive", "extra off"] },
    ],
  },
  {
    slug: "age-calculator",
    name: "Age Calculator",
    shortDescription: "Exact age in years, months and days, plus a countdown to your next birthday.",
    categories: ["productivity", "calculators"],
    keywords: ["age", "birthday", "date of birth", "dob", "years", "days"],
    icon: "cake",
    status: "live",
    popular: true,
  },
  {
    slug: "sip-calculator",
    name: "SIP Calculator",
    shortDescription: "Estimate SIP returns, invested amount and future value of monthly investments.",
    categories: ["finance-tools", "calculators"],
    keywords: ["sip", "mutual fund", "monthly investment", "returns", "future value", "investment"],
    icon: "trending-up",
    status: "live",
    popular: true,
  },
  {
    slug: "fd-calculator",
    name: "FD Calculator",
    shortDescription: "Calculate fixed-deposit maturity value and total interest earned.",
    categories: ["finance-tools", "calculators"],
    keywords: ["fd", "fixed deposit", "maturity", "interest", "bank deposit", "investment"],
    icon: "landmark",
    status: "live",
  },
  {
    slug: "simple-interest-calculator",
    name: "Simple Interest Calculator",
    shortDescription: "Find simple interest and the total amount from principal, rate and time.",
    categories: ["finance-tools", "calculators"],
    keywords: ["simple interest", "principal", "rate", "time", "loan interest"],
    icon: "percent",
    status: "live",
  },
  {
    slug: "income-tax-calculator",
    name: "Income Tax Calculator",
    shortDescription: "Compare old vs new regime tax for FY 2025-26 and 2026-27, with deductions, rebate and surcharge.",
    categories: ["finance-tools","calculators"],
    keywords: ["income tax","tax calculator","new regime","old regime","87a rebate","salary tax","itr","fy 2026-27"],
    icon: "receipt-indian-rupee",
    status: "live",
    popular: true,
  },
  {
    slug: "hra-calculator",
    name: "HRA Calculator",
    shortDescription: "Work out how much of your house rent allowance is tax-free, with the 8-city metro rule.",
    categories: ["finance-tools","calculators"],
    keywords: ["hra","house rent allowance","hra exemption","rent","section 10(13a)","metro"],
    icon: "house",
    status: "live",
  },
  {
    slug: "gratuity-calculator",
    name: "Gratuity Calculator",
    shortDescription: "Calculate gratuity with the 15/26 formula, the tax-free limit and the new labour code rules.",
    categories: ["finance-tools","calculators"],
    keywords: ["gratuity","gratuity formula","payment of gratuity act","retirement","labour code","resignation"],
    icon: "hand-coins",
    status: "live",
  },
  {
    slug: "epf-calculator",
    name: "EPF Calculator",
    shortDescription: "Project your PF balance at retirement, with employer share, EPS split and 8.25% interest.",
    categories: ["finance-tools","calculators"],
    keywords: ["epf","pf calculator","provident fund","epfo","vpf","retirement corpus","eps"],
    icon: "piggy-bank",
    status: "live",
  },
  {
    slug: "mutual-fund-calculator",
    name: "Mutual Fund Calculator",
    shortDescription: "Project returns from a SIP, step-up SIP or lump sum, adjusted for inflation.",
    categories: ["finance-tools","calculators"],
    keywords: ["mutual fund","lumpsum","step up sip","sip returns","investment","inflation","elss"],
    icon: "chart-line",
    status: "live",
  },
  {
    slug: "car-loan-calculator",
    name: "Car Loan Calculator",
    shortDescription: "Car loan EMI from on-road price and down payment, with total interest and cost of the car.",
    categories: ["finance-tools","calculators"],
    keywords: ["car loan","auto loan","vehicle loan","car emi","down payment","on-road price"],
    icon: "car",
    status: "live",
  },
  {
    slug: "bmi-calculator",
    name: "BMI Calculator",
    shortDescription: "Check body mass index and the healthy weight range for your height.",
    categories: ["calculators"],
    keywords: ["bmi", "body mass index", "healthy weight", "height", "weight", "health"],
    icon: "calculator",
    status: "live",
  },
  {
    slug: "tdee-calculator",
    name: "TDEE Calculator",
    shortDescription: "Estimate resting energy use and total daily calories from body measurements and activity.",
    categories: ["health-fitness", "calculators"],
    keywords: ["tdee calculator", "daily calories", "energy expenditure", "maintenance calories", "bmr calculator"],
    icon: "calculator",
    status: "live",
  },
  {
    slug: "macronutrient-calculator",
    name: "Macronutrient Calculator",
    shortDescription: "Estimate daily protein, carbohydrate and fat grams from calories and a fitness goal.",
    categories: ["health-fitness", "calculators"],
    keywords: ["macro calculator", "macronutrient calculator", "protein carbs fat", "daily macros", "calorie target"],
    icon: "percent",
    status: "live",
  },
  {
    slug: "pregnancy-due-date-calculator",
    name: "Pregnancy Due Date Calculator",
    shortDescription: "Estimate a pregnancy due date and key dates from the first day of the last period.",
    categories: ["health-fitness", "calculators"],
    keywords: ["pregnancy due date", "due date calculator", "LMP calculator", "pregnancy weeks", "estimated delivery date"],
    icon: "cake",
    status: "live",
  },
  {
    slug: "one-rep-max-calculator",
    name: "One-Rep Max Calculator",
    shortDescription: "Estimate one-repetition maximum and training percentages from a completed lift set.",
    categories: ["health-fitness", "calculators"],
    keywords: ["one rep max calculator", "1rm calculator", "strength calculator", "lifting max", "training percentage"],
    icon: "trending-up",
    status: "live",
  },
  {
    slug: "mortgage-refinance-breakeven-calculator",
    name: "Mortgage Refinance Breakeven Calculator",
    shortDescription: "Compare current and new mortgage payments and estimate when savings recover closing costs.",
    categories: ["real-estate-tools", "finance-tools", "calculators"],
    keywords: ["refinance break even", "mortgage refinance calculator", "closing costs", "monthly mortgage savings", "refinancing"],
    icon: "landmark",
    status: "live",
  },
  {
    slug: "rent-vs-buy-calculator",
    name: "Rent vs. Buy Calculator",
    shortDescription: "Compare estimated renting and homeownership costs over a selected time horizon.",
    categories: ["real-estate-tools", "finance-tools", "calculators"],
    keywords: ["rent vs buy calculator", "rent or buy", "homeownership costs", "property tax", "home appreciation", "rent inflation"],
    icon: "calculator",
    status: "live",
  },
  {
    slug: "fha-loan-calculator",
    name: "FHA Loan Calculator",
    shortDescription: "Estimate an FHA payment with down payment, upfront MIP, annual MIP, taxes and insurance.",
    categories: ["real-estate-tools", "finance-tools", "calculators"],
    keywords: ["FHA loan calculator", "FHA mortgage payment", "FHA MIP", "upfront mortgage insurance", "FHA down payment"],
    icon: "landmark",
    status: "live",
  },
  {
    slug: "salary-to-hourly-calculator",
    name: "Salary to Hourly Calculator",
    shortDescription: "Convert annual salary into gross and estimated take-home hourly, monthly and yearly pay.",
    categories: ["finance-tools", "calculators"],
    keywords: ["salary to hourly", "hourly wage", "annual salary", "monthly salary", "take home pay", "pay converter"],
    icon: "wallet",
    status: "live",
  },
  {
    slug: "freelance-hourly-rate-calculator",
    name: "Freelance Hourly Rate Calculator",
    shortDescription: "Estimate a sustainable freelance rate from income goals, expenses, taxes and billable hours.",
    categories: ["business-tools", "finance-tools", "calculators"],
    keywords: ["freelance hourly rate", "freelancer rate", "consulting rate", "day rate", "billable hours", "what to charge"],
    icon: "trending-up",
    status: "live",
  },

  {
    slug: "invoice-generator",
    name: "Invoice Generator",
    shortDescription: "Professional GST and non-GST invoices with PDF download.",
    categories: ["business-tools"],
    keywords: ["invoice", "bill", "gst invoice", "tax invoice", "billing"],
    icon: "receipt",
    status: "live",
    popular: true,
  },
  {
    slug: "quotation-generator",
    name: "Quotation Generator",
    shortDescription: "Branded quotations and estimates with automatic totals.",
    categories: ["business-tools"],
    keywords: ["quotation", "quote", "estimate", "proposal"],
    icon: "file-text",
    status: "live",
  },
  {
    slug: "profit-margin-calculator",
    name: "Profit Margin Calculator",
    shortDescription: "Profit, margin, markup and target selling price for your products.",
    categories: ["business-tools", "calculators"],
    keywords: ["profit", "margin", "markup", "selling price", "cost price"],
    icon: "trending-up",
    status: "live",
  },
  {
    slug: "shipping-cost-calculator",
    name: "Shipping Cost Calculator",
    shortDescription: "Volumetric weight, chargeable weight and total courier cost.",
    categories: ["business-tools", "calculators"],
    keywords: ["shipping", "courier", "volumetric weight", "delivery", "cod"],
    icon: "truck",
    status: "live",
  },
  {
    slug: "expense-tracker",
    name: "Daily Expense Tracker",
    shortDescription: "Track daily spending by category with charts and reports.",
    categories: ["business-tools", "productivity"],
    keywords: ["expense", "spending", "budget", "kharcha", "money"],
    icon: "wallet",
    status: "live",
  },
  {
    slug: "image-to-pdf",
    name: "Image to PDF",
    shortDescription: "Combine JPG, PNG and WEBP images into a single PDF.",
    categories: ["pdf-tools"],
    keywords: ["image to pdf", "jpg to pdf", "png to pdf", "photo to pdf", "convert", "pdf"],
    icon: "file-image",
    status: "live",
    popular: true,
    group: "convert-to",
  },
  {
    slug: "pdf-to-image",
    name: "PDF to Image",
    shortDescription: "Turn PDF pages into high-quality JPG or PNG images.",
    categories: ["pdf-tools"],
    keywords: ["pdf to image", "pdf to jpg", "pdf to png", "convert", "pdf"],
    icon: "images",
    status: "live",
    group: "convert-from",
  },
  {
    slug: "image-compressor",
    name: "Image Compressor",
    shortDescription: "Compress the file size of PNG, JPEG, WEBP, or HEIC images online.",
    categories: ["image-tools"],
    keywords: ["compress", "image size", "reduce", "kb", "optimize", "photo"],
    icon: "image-down",
    status: "live",
    popular: true,
    group: "image",
    features: ["Reduce image dimensions based on KB or MB.", "Improve image compression while keeping visual quality."],
  },
  {
    slug: "image-resizer",
    name: "Image Resizer",
    shortDescription: "Resize an image in pixels, percentage, or ratio online.",
    categories: ["image-tools"],
    keywords: ["resize", "dimensions", "passport photo", "instagram", "thumbnail"],
    icon: "scaling",
    status: "live",
    group: "image",
    features: ["Downscale or upscale with fit, crop, and quality controls.", "Supports browser-readable PNG, JPEG, WEBP, GIF, BMP, and SVG images."],
  },
  {
    slug: "bulk-image-resizer",
    name: "Bulk Image Resizer",
    shortDescription: "Resize, convert, or compress multiple images quickly.",
    categories: ["image-tools"],
    keywords: ["bulk resize", "batch images", "multiple images", "compress batch", "convert batch"],
    icon: "images",
    status: "live",
    group: "image",
    features: ["Resize multiple PNG, JPEG, or WEBP images in one batch.", "Download all processed images together as a ZIP."],
  },
  {
    slug: "image-converter",
    name: "Image Converter",
    shortDescription: "Convert an image to PNG, JPEG, or WEBP online.",
    categories: ["image-tools"],
    keywords: ["image converter", "webp to jpeg", "webp to png", "jpeg to png", "png to jpeg"],
    icon: "file-image",
    status: "live",
    group: "image",
    features: ["WEBP to JPEG — WEBP to PNG — JPEG to PNG.", "PNG to JPEG with quality and background controls."],
  },
  {
    slug: "gif-resizer",
    name: "GIF Resizer",
    shortDescription: "Crop, resize, or edit an animated GIF online.",
    categories: ["image-tools"],
    keywords: ["gif resizer", "resize animation", "crop gif", "gif speed"],
    icon: "scaling",
    status: "live",
    group: "animation",
    features: ["Cut out GIF frames, adjust play speed, or fill the background with color.", "Optimize GIF for high quality or smallest file size."],
  },
  {
    slug: "gif-converter",
    name: "GIF Converter",
    shortDescription: "Combine multiple images into an animated GIF online.",
    categories: ["image-tools"],
    keywords: ["gif converter", "video to gif", "mp4 to gif", "webp to gif", "gif to mp4"],
    icon: "images",
    status: "live",
    group: "animation",
    features: ["Make an animated GIF from PNG, JPEG, or WEBP images.", "Control output width and the time shown per frame."],
  },
  {
    slug: "icon-editor",
    name: "Icon Editor",
    shortDescription: "View and edit Windows icons (ICO files) directly in the browser.",
    categories: ["image-tools"],
    keywords: ["icon editor", "ico editor", "windows icon", "extract ico"],
    icon: "pencil-line",
    status: "live",
    group: "icon",
    features: ["Inspect every embedded size, format, and color depth.", "Extract modern ICO layers as PNG images."],
  },
  {
    slug: "icon-converter",
    name: "Icon Converter",
    shortDescription: "Convert an image to a compatible Windows ICO file.",
    categories: ["image-tools"],
    keywords: ["icon converter", "png to ico", "jpg to ico", "windows ico"],
    icon: "file-output",
    status: "live",
    group: "icon",
    features: ["Customize the icon background and rounded corners.", "Create a multi-size Windows ICO file from an image."],
  },
  {
    slug: "favicon-generator",
    name: "Favicon Generator",
    shortDescription: "Generate favicon images in all the required sizes.",
    categories: ["image-tools"],
    keywords: ["favicon", "favicon generator", "website icon", "apple touch icon"],
    icon: "sparkles",
    status: "live",
    group: "icon",
    features: ["Customize the favicon background and rounded corners.", "Get ready-to-use favicon files and HTML code."],
  },
  {
    slug: "color-picker",
    name: "Color Picker",
    shortDescription: "Pick colors from an image, sampler, or spectrum.",
    categories: ["image-tools"],
    keywords: ["color picker", "image color", "hex", "rgb", "hsl", "eyedropper"],
    icon: "crop",
    status: "live",
    group: "color",
    features: ["Pick any pixel from an uploaded image.", "Copy HEX, RGB, HSL, and CSS color values."],
  },
  {
    slug: "task-manager",
    name: "Reminder & Task Manager",
    shortDescription: "Plan today's tasks with priorities, due dates and reminders.",
    categories: ["productivity"],
    keywords: ["task", "todo", "reminder", "to-do", "planner"],
    icon: "list-todo",
    status: "live",
  },
  {
    slug: "qr-code-generator",
    name: "QR Code Generator",
    shortDescription: "QR codes for UPI payments, WiFi, links, WhatsApp and more.",
    categories: ["qr-security"],
    keywords: ["qr", "qr code", "upi qr", "wifi qr", "barcode"],
    icon: "qr-code",
    status: "live",
    popular: true,
  },
  {
    slug: "password-generator",
    name: "Password Generator",
    shortDescription: "Strong random passwords generated securely in your browser.",
    categories: ["qr-security"],
    keywords: ["password", "secure", "random", "strong password"],
    icon: "key-round",
    status: "live",
  },
  {
    slug: "whatsapp-message-generator",
    name: "WhatsApp Message Generator",
    shortDescription: "Order, payment and festival messages ready to send on WhatsApp.",
    categories: ["communication"],
    keywords: ["whatsapp", "message", "template", "reminder", "wishes"],
    icon: "message-circle",
    status: "live",
  },
  {
    slug: "word-character-counter",
    name: "Word & Character Counter",
    shortDescription: "Count words, characters, sentences and reading time, with keyword-density insights.",
    categories: ["text-tools"],
    keywords: ["word counter", "character counter", "reading time", "keyword density", "essay length", "meta description length"],
    icon: "file-text",
    status: "live",
  },
  {
    slug: "case-converter",
    name: "Case Converter",
    shortDescription: "Convert text to uppercase, title or sentence case, or code cases like camelCase, snake_case and kebab-case.",
    categories: ["text-tools"],
    keywords: ["case converter", "text case converter", "uppercase", "lowercase", "title case", "sentence case", "alternating case", "camelcase", "pascalcase", "snake case", "kebab case", "constant case"],
    icon: "type",
    status: "live",
  },
  {
    slug: "invisible-character",
    name: "Invisible Character Copy",
    shortDescription: "Copy invisible Unicode characters for compatible profiles, messages and text formatting.",
    categories: ["text-tools"],
    keywords: ["invisible character", "blank space copy", "invisible text", "braille blank", "empty character"],
    icon: "code",
    status: "live",
  },
  {
    slug: "lorem-ipsum-generator",
    name: "Lorem Ipsum Generator",
    shortDescription: "Generate placeholder paragraphs, sentences or words for layouts and prototypes.",
    categories: ["text-tools"],
    keywords: ["lorem ipsum generator", "dummy text", "placeholder text", "filler text", "sample paragraphs"],
    icon: "file-text",
    status: "live",
  },
  {
    slug: "social-media-caption-spacer",
    name: "Social Media Caption Spacer",
    shortDescription: "Preserve intentional blank lines when formatting captions for social platforms.",
    categories: ["text-tools", "communication"],
    keywords: ["caption spacer", "instagram line break", "linkedin formatting", "social media caption", "blank line"],
    icon: "message-circle",
    status: "live",
  },
  // ---- Creator & streaming ----
  {
    slug: "video-bitrate-calculator",
    name: "Video Bitrate Calculator",
    shortDescription: "Find the OBS bitrate for Twitch or YouTube from your upload speed, resolution and frame rate.",
    categories: ["creator-tools", "calculators"],
    keywords: ["video bitrate calculator", "obs bitrate", "stream bitrate", "twitch bitrate", "youtube live bitrate", "upload speed for streaming", "1080p60 bitrate"],
    icon: "video",
    status: "live",
  },
  {
    slug: "aspect-ratio-calculator",
    name: "Aspect Ratio Calculator",
    shortDescription: "Get exact crop and export sizes when turning 16:9 video into 9:16 Reels, TikTok, Shorts or square posts.",
    categories: ["creator-tools", "calculators"],
    keywords: ["aspect ratio calculator", "aspect ratio resizer", "16:9 to 9:16", "crop video for reels", "tiktok video size", "shorts dimensions", "video resolution"],
    icon: "ratio",
    status: "live",
  },
  {
    slug: "youtube-chapter-generator",
    name: "YouTube Chapter Generator",
    shortDescription: "Format timestamps so YouTube shows them as chapters, and check the 0:00, order and 10-second rules.",
    categories: ["creator-tools", "text-tools"],
    keywords: ["youtube chapters", "youtube timestamps", "chapter generator", "video chapters", "timestamp formatter", "youtube description timestamps"],
    icon: "list-video",
    status: "live",
  },
  // ---- PDF suite ----
  {
    slug: "merge-pdf",
    name: "Merge PDF",
    shortDescription: "Combine several PDFs into one, in the order you choose.",
    categories: [
      "pdf-tools"
    ],
    keywords: [
      "merge pdf",
      "combine pdf",
      "join pdf",
      "append pdf"
    ],
    icon: "merge",
    status: "live",
    group: "organize",
    popular: true
  },
  {
    slug: "split-pdf",
    name: "Split PDF",
    shortDescription: "Split a PDF into separate files by page ranges or every N pages.",
    categories: [
      "pdf-tools"
    ],
    keywords: [
      "split pdf",
      "separate pdf",
      "divide pdf",
      "pdf pages"
    ],
    icon: "split",
    status: "live",
    group: "organize"
  },
  {
    slug: "remove-pdf-pages",
    name: "Remove PDF Pages",
    shortDescription: "Delete unwanted pages from a PDF.",
    categories: [
      "pdf-tools"
    ],
    keywords: [
      "remove pages",
      "delete pdf pages",
      "remove pdf page"
    ],
    icon: "file-minus",
    status: "live",
    group: "organize"
  },
  {
    slug: "extract-pdf-pages",
    name: "Extract PDF Pages",
    shortDescription: "Save selected pages as a new PDF or separate files.",
    categories: [
      "pdf-tools"
    ],
    keywords: [
      "extract pages",
      "pdf page extract",
      "select pages"
    ],
    icon: "file-output",
    status: "live",
    group: "organize"
  },
  {
    slug: "organize-pdf",
    name: "Organize PDF",
    shortDescription: "Reorder, rotate, duplicate, delete and add blank pages.",
    categories: [
      "pdf-tools"
    ],
    keywords: [
      "organize pdf",
      "reorder pdf pages",
      "rearrange pdf",
      "sort pages"
    ],
    icon: "layout-grid",
    status: "live",
    group: "organize"
  },
  {
    slug: "scan-to-pdf",
    name: "Scan to PDF",
    shortDescription: "Photograph documents with your phone and save them as a clean PDF.",
    categories: [
      "pdf-tools"
    ],
    keywords: [
      "scan to pdf",
      "scanner",
      "camera to pdf",
      "document scan"
    ],
    icon: "scan-line",
    status: "live",
    group: "organize"
  },
  {
    slug: "compress-pdf",
    name: "Compress PDF",
    shortDescription: "Reduce PDF file size for email and upload limits.",
    categories: [
      "pdf-tools"
    ],
    keywords: [
      "compress pdf",
      "reduce pdf size",
      "pdf kb",
      "shrink pdf",
      "optimize pdf"
    ],
    icon: "minimize",
    status: "live",
    group: "optimize",
    popular: true
  },
  {
    slug: "repair-pdf",
    name: "Repair PDF",
    shortDescription: "Fix damaged PDFs that won't open or show errors.",
    categories: [
      "pdf-tools"
    ],
    keywords: [
      "repair pdf",
      "fix pdf",
      "corrupt pdf",
      "damaged pdf"
    ],
    icon: "wrench",
    status: "live",
    group: "optimize"
  },
  {
    slug: "ocr-pdf",
    name: "OCR PDF",
    shortDescription: "Make scanned PDFs searchable and copyable.",
    categories: [
      "pdf-tools"
    ],
    keywords: [
      "ocr",
      "searchable pdf",
      "scan text",
      "extract text"
    ],
    icon: "scan-text",
    status: "live",
    group: "optimize"
  },
  {
    slug: "word-to-pdf",
    name: "Word to PDF",
    shortDescription: "Convert Word (.docx) documents to PDF.",
    categories: [
      "pdf-tools"
    ],
    keywords: [
      "word to pdf",
      "docx to pdf",
      "doc to pdf"
    ],
    icon: "file-type",
    status: "live",
    group: "convert-to"
  },
  {
    slug: "powerpoint-to-pdf",
    name: "PowerPoint to PDF",
    shortDescription: "Convert PowerPoint (.pptx) slides to PDF.",
    categories: [
      "pdf-tools"
    ],
    keywords: [
      "ppt to pdf",
      "pptx to pdf",
      "powerpoint to pdf"
    ],
    icon: "presentation",
    status: "live",
    group: "convert-to"
  },
  {
    slug: "excel-to-pdf",
    name: "Excel to PDF",
    shortDescription: "Convert XLSX, XLS and CSV spreadsheets to PDF.",
    categories: [
      "pdf-tools"
    ],
    keywords: [
      "excel to pdf",
      "xlsx to pdf",
      "xls to pdf",
      "spreadsheet"
    ],
    icon: "file-spreadsheet",
    status: "live",
    group: "convert-to"
  },
  {
    slug: "html-to-pdf",
    name: "HTML to PDF",
    shortDescription: "Turn HTML code or a saved web page into a PDF.",
    categories: [
      "pdf-tools"
    ],
    keywords: [
      "html to pdf",
      "web page to pdf",
      "url to pdf"
    ],
    icon: "code",
    status: "live",
    group: "convert-to"
  },
  {
    slug: "pdf-to-word",
    name: "PDF to Word",
    shortDescription: "Convert PDF to an editable Word document.",
    categories: [
      "pdf-tools"
    ],
    keywords: [
      "pdf to word",
      "pdf to docx",
      "editable"
    ],
    icon: "file-type",
    status: "live",
    group: "convert-from"
  },
  {
    slug: "pdf-to-powerpoint",
    name: "PDF to PowerPoint",
    shortDescription: "Turn PDF pages into PowerPoint slides.",
    categories: [
      "pdf-tools"
    ],
    keywords: [
      "pdf to ppt",
      "pdf to pptx",
      "pdf to powerpoint"
    ],
    icon: "presentation",
    status: "live",
    group: "convert-from"
  },
  {
    slug: "pdf-to-excel",
    name: "PDF to Excel",
    shortDescription: "Pull tables from a PDF into a spreadsheet.",
    categories: [
      "pdf-tools"
    ],
    keywords: [
      "pdf to excel",
      "pdf to xlsx",
      "extract tables"
    ],
    icon: "file-spreadsheet",
    status: "live",
    group: "convert-from"
  },
  {
    slug: "pdf-to-pdfa",
    name: "PDF to PDF/A",
    shortDescription: "Convert to PDF/A for long-term archiving and government portals.",
    categories: [
      "pdf-tools"
    ],
    keywords: [
      "pdf/a",
      "pdfa",
      "archive pdf"
    ],
    icon: "file-check",
    status: "live",
    group: "convert-from"
  },
  {
    slug: "rotate-pdf",
    name: "Rotate PDF",
    shortDescription: "Rotate all or some pages of a PDF.",
    categories: [
      "pdf-tools"
    ],
    keywords: [
      "rotate pdf",
      "turn pdf pages",
      "landscape",
      "portrait"
    ],
    icon: "rotate-cw",
    status: "live",
    group: "edit"
  },
  {
    slug: "add-page-numbers",
    name: "Add Page Numbers",
    shortDescription: "Number PDF pages in the position and style you choose.",
    categories: [
      "pdf-tools"
    ],
    keywords: [
      "page numbers",
      "number pdf pages",
      "pagination"
    ],
    icon: "list-ordered",
    status: "live",
    group: "edit"
  },
  {
    slug: "add-watermark",
    name: "Add Watermark",
    shortDescription: "Stamp text or a logo over your PDF pages.",
    categories: [
      "pdf-tools"
    ],
    keywords: [
      "watermark pdf",
      "stamp pdf",
      "confidential",
      "logo on pdf"
    ],
    icon: "stamp",
    status: "live",
    group: "edit"
  },
  {
    slug: "crop-pdf",
    name: "Crop PDF",
    shortDescription: "Trim margins from PDF pages.",
    categories: [
      "pdf-tools"
    ],
    keywords: [
      "crop pdf",
      "trim pdf",
      "margins",
      "cut pdf"
    ],
    icon: "crop",
    status: "live",
    group: "edit"
  },
  {
    slug: "edit-pdf",
    name: "Edit PDF",
    shortDescription: "Add text, images and white-out boxes to a PDF.",
    categories: [
      "pdf-tools"
    ],
    keywords: [
      "edit pdf",
      "add text to pdf",
      "pdf editor",
      "white out"
    ],
    icon: "pencil-line",
    status: "live",
    group: "edit",
    popular: true
  },
  {
    slug: "pdf-forms",
    name: "Fill PDF Forms",
    shortDescription: "Fill in PDF forms and save or flatten the answers.",
    categories: [
      "pdf-tools"
    ],
    keywords: [
      "fill pdf form",
      "pdf form",
      "fillable pdf",
      "flatten"
    ],
    icon: "clipboard-list",
    status: "live",
    group: "edit"
  },
  {
    slug: "unlock-pdf",
    name: "Unlock PDF",
    shortDescription: "Remove the password from a PDF you can open.",
    categories: [
      "pdf-tools",
      "qr-security"
    ],
    keywords: [
      "unlock pdf",
      "remove pdf password",
      "decrypt pdf"
    ],
    icon: "lock-open",
    status: "live",
    group: "security"
  },
  {
    slug: "protect-pdf",
    name: "Protect PDF",
    shortDescription: "Add a password and restrict printing, copying or editing.",
    categories: [
      "pdf-tools",
      "qr-security"
    ],
    keywords: [
      "protect pdf",
      "password pdf",
      "encrypt pdf",
      "lock pdf"
    ],
    icon: "lock",
    status: "live",
    group: "security"
  },
  {
    slug: "sign-pdf",
    name: "Sign PDF",
    shortDescription: "Draw, type or upload your signature and place it on a PDF.",
    categories: [
      "pdf-tools",
      "qr-security"
    ],
    keywords: [
      "sign pdf",
      "e-sign",
      "signature",
      "esign pdf"
    ],
    icon: "signature",
    status: "live",
    group: "security",
    popular: true
  },
  {
    slug: "redact-pdf",
    name: "Redact PDF",
    shortDescription: "Permanently black out sensitive text and areas.",
    categories: [
      "pdf-tools",
      "qr-security"
    ],
    keywords: [
      "redact pdf",
      "black out",
      "hide text",
      "remove sensitive"
    ],
    icon: "eye-off",
    status: "live",
    group: "security"
  },
  {
    slug: "compare-pdf",
    name: "Compare PDF",
    shortDescription: "See what changed between two versions of a PDF.",
    categories: [
      "pdf-tools"
    ],
    keywords: [
      "compare pdf",
      "diff pdf",
      "pdf changes",
      "difference"
    ],
    icon: "git-compare",
    status: "live",
    group: "security"
  },
  {
    slug: "ai-pdf-summarizer",
    name: "AI PDF Summarizer",
    shortDescription: "Get a short summary of any PDF.",
    categories: [
      "pdf-tools"
    ],
    keywords: [
      "ai summary",
      "summarize pdf",
      "pdf summary"
    ],
    icon: "sparkles",
    status: "live",
    group: "intelligence"
  },
  {
    slug: "translate-pdf",
    name: "Translate PDF",
    shortDescription: "Translate a PDF into Hindi, Marathi and other languages.",
    categories: [
      "pdf-tools"
    ],
    keywords: [
      "translate pdf",
      "pdf translation",
      "hindi",
      "marathi"
    ],
    icon: "languages",
    status: "live",
    group: "intelligence"
  },
  {
    slug: "pdf-to-markdown",
    name: "PDF to Markdown",
    shortDescription: "Turn PDF text into clean Markdown with headings and lists.",
    categories: [
      "pdf-tools"
    ],
    keywords: [
      "pdf to markdown",
      "md",
      "extract text",
      "pdf to text"
    ],
    icon: "file-code",
    status: "live",
    group: "intelligence"
  },
  {
    slug: "cgpa-calculator",
    name: "CGPA Calculator",
    shortDescription: "Calculate CGPA from semester SGPAs or SGPA from subject grades, and convert to percentage.",
    categories: ["calculators"],
    keywords: ["cgpa","sgpa","gpa","cgpa to percentage","grade point","college","cbse"],
    icon: "graduation-cap",
    status: "live",
  },
  {
    slug: "unit-converter",
    name: "Unit Converter",
    shortDescription: "Convert length, weight, area, volume, temperature, speed, fuel economy and more.",
    categories: ["calculators"],
    keywords: ["unit converter","conversion","length","weight","area","acre to guntha","celsius to fahrenheit","km to miles","kg to lbs"],
    icon: "ruler",
    status: "live",
  },
  {
    slug: "date-difference-calculator",
    name: "Date Difference Calculator",
    shortDescription: "Count the days, weeks and months between two dates, or add and subtract days.",
    categories: ["productivity","calculators"],
    keywords: ["date difference","days between dates","date calculator","business days","add days to date","date duration"],
    icon: "calendar-range",
    status: "live",
  },
  {
    slug: "time-difference-calculator",
    name: "Time Difference Calculator",
    shortDescription: "Find the hours and minutes between two times, including overnight shifts and breaks.",
    categories: ["productivity","calculators"],
    keywords: ["time difference","hours between times","time duration","hours worked","time calculator"],
    icon: "clock",
    status: "live",
  },
  {
    slug: "time-zone-converter",
    name: "Time Zone Converter",
    shortDescription: "Convert a time between India and any city or time zone, with daylight saving handled.",
    categories: ["productivity"],
    keywords: ["time zone converter","ist to est","ist to pst","world clock","meeting time","utc","gmt"],
    icon: "globe",
    status: "live",
  },
  {
    slug: "countdown-timer",
    name: "Countdown Timer",
    shortDescription: "A full-screen timer with alarm, or a live countdown to any date and time.",
    categories: ["productivity"],
    keywords: ["countdown timer","timer","online timer","stopwatch","countdown to date","pomodoro","alarm"],
    icon: "timer",
    status: "live",
  },
  {
    slug: "random-picker",
    name: "Random Picker / Wheel Spinner",
    shortDescription: "Spin a wheel of names, pick random winners or shuffle a list — fair and random.",
    categories: ["productivity"],
    keywords: ["random picker","wheel spinner","spin the wheel","random name picker","lucky draw","giveaway","shuffle list"],
    icon: "ferris-wheel",
    status: "live",
  },
  {
    slug: "coin-flip",
    name: "Coin Flip",
    shortDescription: "Flip a coin online — heads or tails, one coin or many, with a running tally.",
    categories: ["productivity"],
    keywords: ["coin flip","coin toss","heads or tails","toss a coin","random"],
    icon: "coins",
    status: "live",
  },
  {
    slug: "speech-to-text",
    name: "Speech to Text",
    shortDescription: "Dictate in English, Hindi, Marathi and more — your speech typed out live, ready to copy.",
    categories: ["text-tools"],
    keywords: ["speech to text","voice typing","dictation","voice to text","hindi voice typing","marathi voice typing","transcribe"],
    icon: "mic",
    status: "live",
  },
  {
    slug: "whatsapp-direct-link",
    name: "WhatsApp Direct Link",
    shortDescription: "Chat with any number on WhatsApp without saving it — get a wa.me link and QR code.",
    categories: ["communication"],
    keywords: ["whatsapp direct","wa.me link","whatsapp without saving number","click to chat","whatsapp link generator"],
    icon: "link",
    status: "live",
  },
  ...keyboardTools,
  ...fontConverterTools,
  ...devToolEntries,
] satisfies Tool[]).map((tool): Tool => (DEV_EXTRAS[tool.slug] ? { ...tool, categories: [...tool.categories, "developer-tools"] } : tool));

export const liveTools = tools.filter((t) => t.status === "live");

export function getTool(slug: string): Tool {
  const tool = tools.find((t) => t.slug === slug);
  if (!tool) throw new Error(`Unknown tool: ${slug}`);
  return tool;
}

export function getToolOrNull(slug: string): Tool | null {
  return tools.find((t) => t.slug === slug) ?? null;
}

export function getCategory(slug: string): Category | undefined {
  return categories.find((c) => c.slug === slug);
}

export function getToolsInCategory(slug: CategorySlug): Tool[] {
  return sortLiveFirst(tools.filter((t) => t.categories.includes(slug)));
}

/** PDF tools split into their sections (Organize, Optimize, …). */
export function getPdfToolsByGroup() {
  const pdf = getToolsInCategory("pdf-tools");
  return PDF_GROUPS.map((g) => ({ ...g, tools: pdf.filter((t) => t.group === g.id) })).filter((g) => g.tools.length > 0);
}

export function getTypingToolsByGroup() {
  const typing = getToolsInCategory("typing-tools");
  return TYPING_GROUPS.map((g) => ({ ...g, tools: typing.filter((t) => t.group === g.id) })).filter((g) => g.tools.length > 0);
}

export function getFontConvertersByGroup() {
  const converters = getToolsInCategory("font-converters");
  return FONT_CONVERTER_GROUPS.map((g) => ({ ...g, tools: converters.filter((t) => t.group === g.id) })).filter((g) => g.tools.length > 0);
}

export function getImageToolsByGroup() {
  const image = getToolsInCategory("image-tools");
  return IMAGE_GROUPS.map((g) => ({ ...g, tools: image.filter((t) => t.group === g.id) })).filter((g) => g.tools.length > 0);
}

export function getDevToolsByGroup() {
  const dev = getToolsInCategory("developer-tools");
  return DEV_GROUPS.map((g) => ({ ...g, tools: dev.filter((t) => (DEV_EXTRAS[t.slug] ?? t.group) === g.id) })).filter((g) => g.tools.length > 0);
}

/** A category's tools, split into the sections its category page uses (one unnamed section when it has none). */
export function getToolSections(slug: CategorySlug): { name?: string; tools: Tool[] }[] {
  if (slug === "pdf-tools") return getPdfToolsByGroup();
  if (slug === "image-tools") return getImageToolsByGroup();
  if (slug === "typing-tools") return getTypingToolsByGroup();
  if (slug === "font-converters") return getFontConvertersByGroup();
  if (slug === "developer-tools") return getDevToolsByGroup();
  return [{ tools: getToolsInCategory(slug) }];
}

export function getPopularTools(): Tool[] {
  return sortLiveFirst(tools.filter((t) => t.popular));
}

export function getRelatedTools(tool: Tool, limit = 4): Tool[] {
  const others = tools.filter((t) => t.slug !== tool.slug && t.status === "live");
  // Same PDF section first (merge → split, organise…), then anything in a shared category.
  const sameGroup = tool.group ? others.filter((t) => t.group === tool.group) : [];
  const sameCategory = others.filter((t) => !sameGroup.includes(t) && t.categories.some((c) => tool.categories.includes(c)));
  return [...sameGroup, ...sameCategory].slice(0, limit);
}

export function toolHref(tool: Tool) {
  return `/${tool.slug}`;
}

function sortLiveFirst(list: Tool[]) {
  return [...list].sort((a, b) => Number(b.status === "live") - Number(a.status === "live"));
}
