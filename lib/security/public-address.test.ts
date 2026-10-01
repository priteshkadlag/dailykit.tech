import { describe, expect, it } from "vitest";
import { isPublicAddress } from "@/lib/security/public-address";

describe("isPublicAddress", () => {
  it("allows public addresses", () => {
    for (const ip of ["8.8.8.8", "1.1.1.1", "104.16.0.1", "2606:4700:4700::1111", "2001:4860:4860::8888"]) expect(isPublicAddress(ip)).toBe(true);
  });
  it("refuses private, local, metadata and reserved addresses", () => {
    for (const ip of [
      "127.0.0.1", "10.1.2.3", "172.16.0.1", "172.31.255.255", "192.168.1.1", "169.254.169.254", "100.64.0.1", "0.0.0.0", "224.0.0.1", "255.255.255.255",
      "::1", "::", "fe80::1", "fd00::1", "ff02::1", "::ffff:127.0.0.1", "::ffff:10.0.0.1", "64:ff9b::a00:1", "2001:db8::1", "2002:7f00:1::1", "not-an-ip",
    ]) expect(isPublicAddress(ip), ip).toBe(false);
  });
});
