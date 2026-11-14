import { fitWithin, JPEG_QUALITY } from "@/lib/rules/photos";

// Spec §6.14: draw on a canvas at most 1600 px on the longest side and re-encode
// as JPEG 0.8. Re-encoding drops EXIF (location, camera); "from-image" applies the
// EXIF rotation first so the photo stays upright.
// The photo could not be decoded or re-encoded (unsupported format, too large).
export class PhotoReadError extends Error {
  constructor() {
    super("Không đọc được ảnh này, thử ảnh khác.");
    this.name = "PhotoReadError";
  }
}

export async function compressPhoto(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file, {
    imageOrientation: "from-image",
  }).catch(() => {
    throw new PhotoReadError();
  });
  try {
    const { width, height } = fitWithin(bitmap.width, bitmap.height);
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) throw new PhotoReadError();
    context.drawImage(bitmap, 0, 0, width, height);
    return await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new PhotoReadError())),
        "image/jpeg",
        JPEG_QUALITY,
      ),
    );
  } finally {
    bitmap.close();
  }
}

// The first 128 KB holds the EXIF block of a camera JPEG.
export async function readHead(file: File): Promise<Uint8Array> {
  return new Uint8Array(await file.slice(0, 128 * 1024).arrayBuffer());
}
