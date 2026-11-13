export type Landing = "/dang-nhap" | "/chua-duoc-moi" | "/khai-bao-be" | "/";
export type GateNeed = "anonymous" | "no-family" | "family" | "baby";

export function resolveLanding(s: {
  hasSession: boolean;
  hasFamily: boolean;
  hasBaby: boolean;
}): Landing {
  if (!s.hasSession) return "/dang-nhap";
  if (!s.hasFamily) return "/chua-duoc-moi";
  if (!s.hasBaby) return "/khai-bao-be";
  return "/";
}

const PAGE_FOR_NEED: Record<GateNeed, Landing> = {
  anonymous: "/dang-nhap",
  "no-family": "/chua-duoc-moi",
  family: "/khai-bao-be",
  baby: "/",
};

export function gateRedirect(need: GateNeed, landing: Landing): Landing | null {
  return PAGE_FOR_NEED[need] === landing ? null : landing;
}
