// Spec §6.13: when a pumping timer ends, ask for ml per side (both optional).
export function parsePumpAmounts(raw: {
  left: string;
  right: string;
}):
  | { ok: true; details: { mlLeft?: number; mlRight?: number } }
  | { ok: false; message: string } {
  const details: { mlLeft?: number; mlRight?: number } = {};
  for (const [key, text] of [
    ["mlLeft", raw.left],
    ["mlRight", raw.right],
  ] as const) {
    const value = text.trim();
    if (value === "") continue;
    const n = Number(value);
    if (!/^\d+$/.test(value) || n > 500)
      return { ok: false, message: "Mỗi bên từ 0 đến 500 ml." };
    details[key] = n;
  }
  return { ok: true, details };
}
