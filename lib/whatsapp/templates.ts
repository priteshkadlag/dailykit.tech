import { format } from "date-fns";
import { parseDateInput } from "@/lib/calculations/age";

export interface MessageFields {
  customerName: string;
  businessName: string;
  product: string;
  amount: string;
  orderNumber: string;
  date: string;
  time: string;
  festival: FestivalId;
}

export type FieldKey = keyof Omit<MessageFields, "festival">;

export const FESTIVALS = {
  diwali: { label: "Diwali", greeting: "Happy Diwali! 🪔", wish: "May this festival of lights fill your home with happiness, prosperity and good health." },
  holi: { label: "Holi", greeting: "Happy Holi! 🎨", wish: "May your life be as colourful and joyful as this beautiful festival." },
  eid: { label: "Eid", greeting: "Eid Mubarak! 🌙", wish: "May this Eid bring peace, happiness and blessings to you and your family." },
  christmas: { label: "Christmas", greeting: "Merry Christmas! 🎄", wish: "Wishing you and your loved ones a season full of joy and warmth." },
  "new-year": { label: "New Year", greeting: "Happy New Year! 🎉", wish: "Wishing you success, good health and happiness in the year ahead." },
  ganesh: { label: "Ganesh Chaturthi", greeting: "Happy Ganesh Chaturthi! 🙏", wish: "May Lord Ganesha remove all obstacles and bless you with wisdom and prosperity." },
  navratri: { label: "Navratri", greeting: "Happy Navratri! 🪔", wish: "May Maa Durga bless you with strength, happiness and success." },
  rakhi: { label: "Raksha Bandhan", greeting: "Happy Raksha Bandhan! 🎁", wish: "Wishing you and your family love, togetherness and joy." },
  pongal: { label: "Makar Sankranti / Pongal", greeting: "Happy Makar Sankranti & Pongal! 🪁", wish: "May the harvest season bring abundance and happiness to your home." },
  independence: { label: "Independence Day", greeting: "Happy Independence Day! 🇮🇳", wish: "Let us celebrate the spirit of freedom and unity." },
} as const;
export type FestivalId = keyof typeof FESTIVALS;

export interface MessageTemplate {
  id: string;
  label: string;
  /** Which inputs this template uses, with labels suited to it. */
  fields: Partial<Record<FieldKey, string>>;
  render: (f: MessageFields) => string;
}

const money = (amount: string) => {
  const n = Number(amount.replace(/[,₹\s]/g, ""));
  if (!amount.trim() || !Number.isFinite(n)) return "";
  return `₹${n.toLocaleString("en-IN", { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 })}`;
};

const day = (value: string) => {
  const d = parseDateInput(value);
  return d ? format(d, "EEE, d MMM yyyy") : "";
};

const clock = (value: string) => {
  const m = /^(\d{2}):(\d{2})$/.exec(value);
  if (!m) return "";
  const h = Number(m[1]);
  return `${h % 12 || 12}:${m[2]} ${h < 12 ? "AM" : "PM"}`;
};

/** Join non-empty lines; a lone "" keeps a blank line between paragraphs. */
const lines = (...parts: (string | false | undefined)[]) =>
  parts
    .filter((p): p is string => typeof p === "string")
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

const hello = (name: string) => (name.trim() ? `Hello ${name.trim()},` : "Hello,");
const signoff = (business: string) => (business.trim() ? ["", `Thank you,`, business.trim()] : ["", "Thank you!"]);

export const TEMPLATES: MessageTemplate[] = [
  {
    id: "order-confirmation",
    label: "Order confirmation",
    fields: { customerName: "Customer name", orderNumber: "Order number", product: "Product", amount: "Order amount", date: "Expected delivery", businessName: "Your business name" },
    render: (f) =>
      lines(
        hello(f.customerName),
        "",
        `Your order${f.orderNumber.trim() ? ` #${f.orderNumber.trim()}` : ""} has been confirmed ✅`,
        f.product.trim() && `Item: ${f.product.trim()}`,
        money(f.amount) && `Amount: ${money(f.amount)}`,
        day(f.date) && `Expected delivery: ${day(f.date)}`,
        "",
        "We'll update you when it ships.",
        ...signoff(f.businessName),
      ),
  },
  {
    id: "payment-reminder",
    label: "Payment reminder",
    fields: { customerName: "Customer name", amount: "Amount due", orderNumber: "Invoice number", date: "Due date", businessName: "Your business name" },
    render: (f) =>
      lines(
        hello(f.customerName),
        "",
        `This is a friendly reminder that ${money(f.amount) ? `a payment of ${money(f.amount)}` : "a payment"}${f.orderNumber.trim() ? ` for invoice #${f.orderNumber.trim()}` : ""} is ${day(f.date) ? `due on ${day(f.date)}` : "pending"}.`,
        "",
        "Please ignore this message if you have already paid. You can pay by UPI or bank transfer — reply here if you need the details.",
        ...signoff(f.businessName),
      ),
  },
  {
    id: "delivery-update",
    label: "Delivery update",
    fields: { customerName: "Customer name", orderNumber: "Order number", product: "Product", date: "Delivery date", businessName: "Your business name" },
    render: (f) =>
      lines(
        hello(f.customerName),
        "",
        `Good news! Your order${f.orderNumber.trim() ? ` #${f.orderNumber.trim()}` : ""}${f.product.trim() ? ` (${f.product.trim()})` : ""} has been shipped 🚚`,
        day(f.date) ? `It should reach you by ${day(f.date)}.` : "It will reach you soon.",
        "",
        "Please keep your phone handy for the delivery partner's call.",
        ...signoff(f.businessName),
      ),
  },
  {
    id: "appointment-reminder",
    label: "Appointment reminder",
    fields: { customerName: "Customer name", date: "Appointment date", time: "Time", product: "Service", businessName: "Your business name" },
    render: (f) =>
      lines(
        hello(f.customerName),
        "",
        `This is a reminder of your ${f.product.trim() ? `${f.product.trim()} ` : ""}appointment${f.businessName.trim() ? ` at ${f.businessName.trim()}` : ""}${day(f.date) ? ` on ${day(f.date)}` : ""}${clock(f.time) ? ` at ${clock(f.time)}` : ""}.`,
        "",
        "Please reply YES to confirm, or let us know if you'd like to reschedule.",
        ...signoff(f.businessName),
      ),
  },
  {
    id: "customer-follow-up",
    label: "Customer follow-up",
    fields: { customerName: "Customer name", product: "Product / service", businessName: "Your business name" },
    render: (f) =>
      lines(
        hello(f.customerName),
        "",
        `Thank you for choosing ${f.businessName.trim() || "us"}! We hope you're happy with ${f.product.trim() ? `your ${f.product.trim()}` : "your purchase"}.`,
        "",
        "If you have any questions or feedback, just reply to this message — we'd love to hear from you. 😊",
        ...signoff(f.businessName),
      ),
  },
  {
    id: "product-enquiry",
    label: "Product enquiry",
    fields: { customerName: "Seller / shop name", product: "Product", businessName: "Your name" },
    render: (f) =>
      lines(
        hello(f.customerName),
        "",
        `I'm interested in ${f.product.trim() ? `the ${f.product.trim()}` : "your products"}. Could you please share the price, availability and delivery details?`,
        "",
        f.businessName.trim() ? `Thanks,\n${f.businessName.trim()}` : "Thanks!",
      ),
  },
  {
    id: "business-enquiry",
    label: "Business enquiry",
    fields: { customerName: "Contact name", businessName: "Your name / business", product: "Enquiry about" },
    render: (f) =>
      lines(
        hello(f.customerName),
        "",
        `${f.businessName.trim() ? `This is ${f.businessName.trim()}. ` : ""}I'd like to know more about ${f.product.trim() ? `your ${f.product.trim()}` : "your products and services"}.`,
        "Could you please share details, pricing and a good time to talk?",
        "",
        "Looking forward to hearing from you.",
      ),
  },
  {
    id: "birthday",
    label: "Birthday wishes",
    fields: { customerName: "Name", businessName: "From" },
    render: (f) =>
      lines(
        `Happy Birthday${f.customerName.trim() ? `, ${f.customerName.trim()}` : ""}! 🎂🎉`,
        "",
        "Wishing you a wonderful year ahead filled with happiness, good health and success.",
        f.businessName.trim() && "",
        f.businessName.trim() && `Warm wishes,\n${f.businessName.trim()}`,
      ),
  },
  {
    id: "festival",
    label: "Festival wishes",
    fields: { customerName: "Name", businessName: "From" },
    render: (f) => {
      const fest = FESTIVALS[f.festival];
      return lines(
        f.customerName.trim() ? `Dear ${f.customerName.trim()},` : undefined,
        f.customerName.trim() && "",
        fest.greeting,
        fest.wish,
        f.businessName.trim() && "",
        f.businessName.trim() && `Warm wishes,\n${f.businessName.trim()}`,
      );
    },
  },
];

export function whatsappUrl(message: string, phoneDigits: string | null) {
  return `https://wa.me/${phoneDigits ?? ""}?text=${encodeURIComponent(message)}`;
}
