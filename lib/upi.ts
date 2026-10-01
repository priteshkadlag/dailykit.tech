/** name@bank, e.g. sharma@okhdfc or 9820012345@ybl */
export function isValidUpiId(value: string) {
  return /^[\w.-]{2,256}@[a-zA-Z][a-zA-Z0-9.-]{1,63}$/.test(value.trim());
}

export interface UpiPayment {
  upiId: string;
  payeeName?: string;
  /** Leave out to let the payer type the amount. */
  amount?: number;
  note?: string;
}

/**
 * NPCI UPI deep link, understood by GPay, PhonePe, Paytm, BHIM and bank apps.
 * Spaces are encoded as %20 (some UPI apps don't accept "+").
 */
export function upiLink({ upiId, payeeName, amount, note }: UpiPayment) {
  const params = new URLSearchParams({ pa: upiId.trim() });
  if (payeeName?.trim()) params.set("pn", payeeName.trim());
  if (amount !== undefined && amount > 0) params.set("am", amount.toFixed(2));
  params.set("cu", "INR");
  if (note?.trim()) params.set("tn", note.trim().slice(0, 50));
  return `upi://pay?${params.toString().replaceAll("+", "%20")}`;
}
