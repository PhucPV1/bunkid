// "Vitamin D", "vitamin d3", "VitaminD3 K2": the same drops under the names
// people type; "vitamin dha" is something else.
export const VITAMIN_D = /^vitamin\s*d(?![a-z])/i;

// The form two medicine names are compared in: no outer spaces, lower case,
// no tone marks ("hoá" and "hóa" differ only in where the mark sits), đ as d.
export function medicineKey(name: string): string {
  return name
    .trim()
    .toLocaleLowerCase("vi")
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/đ/g, "d");
}

// Spec 2026-11-17 §4.3: does a logged medicine count for this schedule?
export function sameMedicine(scheduleName: string, logName: string): boolean {
  if (VITAMIN_D.test(scheduleName.trim()))
    return VITAMIN_D.test(logName.trim());
  return medicineKey(scheduleName) === medicineKey(logName);
}
