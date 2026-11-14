// Reads DateTimeOriginal (or DateTime) from the EXIF block of a JPEG and returns
// "YYYY-MM-DD", or null. iOS gives picked photos a lastModified of "now", so this is
// how "Ngày chụp" can default to the real capture day (spec §6.14).
export function exifDate(bytes: Uint8Array): string | null {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (bytes.length < 4 || view.getUint16(0) !== 0xffd8) return null;
  let offset = 2;
  while (offset + 4 <= bytes.length) {
    const marker = view.getUint16(offset);
    const size = view.getUint16(offset + 2);
    if (marker === 0xffe1 && isExifHeader(bytes, offset + 4))
      return readTiff(view, offset + 10, offset + 2 + size);
    if ((marker & 0xff00) !== 0xff00 || marker === 0xffda) return null;
    offset += 2 + size;
  }
  return null;
}

function isExifHeader(bytes: Uint8Array, at: number): boolean {
  const text = String.fromCharCode(...bytes.slice(at, at + 4));
  return text === "Exif" && bytes[at + 4] === 0 && bytes[at + 5] === 0;
}

function readTiff(view: DataView, tiff: number, end: number): string | null {
  if (tiff + 8 > end) return null;
  const little = view.getUint16(tiff) === 0x4949;
  const u16 = (at: number) => view.getUint16(at, little);
  const u32 = (at: number) => view.getUint32(at, little);
  const entries = (ifd: number) => {
    const list: { tag: number; count: number; value: number }[] = [];
    if (ifd + 2 > end) return list;
    const n = u16(ifd);
    for (let i = 0; i < n; i++) {
      const at = ifd + 2 + i * 12;
      if (at + 12 > end) break;
      list.push({ tag: u16(at), count: u32(at + 4), value: u32(at + 8) });
    }
    return list;
  };
  const ascii = (entry: { count: number; value: number }) => {
    const start = tiff + entry.value;
    if (entry.count < 10 || start + 10 > end) return null;
    let text = "";
    for (let i = 0; i < 10; i++)
      text += String.fromCharCode(view.getUint8(start + i));
    const match = /^(\d{4}):(\d{2}):(\d{2})$/.exec(text);
    if (!match || match[1] === "0000") return null;
    return `${match[1]}-${match[2]}-${match[3]}`;
  };
  const ifd0 = entries(tiff + u32(tiff + 4));
  const exifPointer = ifd0.find((e) => e.tag === 0x8769);
  if (exifPointer) {
    const original = entries(tiff + exifPointer.value).find(
      (e) => e.tag === 0x9003,
    );
    if (original) {
      const day = ascii(original);
      if (day) return day;
    }
  }
  const dateTime = ifd0.find((e) => e.tag === 0x0132);
  return dateTime ? ascii(dateTime) : null;
}
