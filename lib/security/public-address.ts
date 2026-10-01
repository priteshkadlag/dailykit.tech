import { BlockList, isIP } from "node:net";

// Addresses the server must never connect to on a visitor's behalf: loopback, private networks,
// link-local (cloud metadata lives at 169.254.169.254), carrier-grade NAT, documentation, multicast
// and reserved ranges. IPv6 is limited to global unicast (2000::/3) minus its special blocks.
const blocked = new BlockList();
for (const [network, prefix] of [
  ["0.0.0.0", 8], ["10.0.0.0", 8], ["100.64.0.0", 10], ["127.0.0.0", 8], ["169.254.0.0", 16], ["172.16.0.0", 12],
  ["192.0.0.0", 24], ["192.0.2.0", 24], ["192.88.99.0", 24], ["192.168.0.0", 16], ["198.18.0.0", 15], ["198.51.100.0", 24],
  ["203.0.113.0", 24], ["224.0.0.0", 4], ["240.0.0.0", 4],
] as const) blocked.addSubnet(network, prefix, "ipv4");
for (const [network, prefix] of [
  ["2001::", 23], ["2001:db8::", 32], ["2002::", 16], ["3fff::", 20],
] as const) blocked.addSubnet(network, prefix, "ipv6");
const globalUnicast = new BlockList();
globalUnicast.addSubnet("2000::", 3, "ipv6");

/** True only for a public, routable unicast IP address. */
export function isPublicAddress(address: string): boolean {
  const version = isIP(address);
  if (version === 4) return !blocked.check(address, "ipv4");
  if (version === 6) return globalUnicast.check(address, "ipv6") && !blocked.check(address, "ipv6");
  return false;
}

/** Ports the status checker may connect to. Keeps it from being used to probe arbitrary services. */
export const ALLOWED_PORTS = new Set(["", "80", "443", "8080", "8443"]);
