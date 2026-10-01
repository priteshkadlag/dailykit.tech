/** Build a modern ICO containing PNG-compressed layers (supported by Windows Vista+). */
export async function pngsToIco(layers: { size: number; blob: Blob }[]) {
  const data = await Promise.all(layers.map(async (layer) => ({ ...layer, bytes: new Uint8Array(await layer.blob.arrayBuffer()) })));
  const headerSize = 6 + data.length * 16;
  const total = headerSize + data.reduce((sum, layer) => sum + layer.bytes.length, 0);
  const buffer = new ArrayBuffer(total);
  const view = new DataView(buffer);
  view.setUint16(0, 0, true);
  view.setUint16(2, 1, true);
  view.setUint16(4, data.length, true);
  let offset = headerSize;
  data.forEach((layer, index) => {
    const entry = 6 + index * 16;
    view.setUint8(entry, layer.size >= 256 ? 0 : layer.size);
    view.setUint8(entry + 1, layer.size >= 256 ? 0 : layer.size);
    view.setUint8(entry + 2, 0);
    view.setUint8(entry + 3, 0);
    view.setUint16(entry + 4, 1, true);
    view.setUint16(entry + 6, 32, true);
    view.setUint32(entry + 8, layer.bytes.length, true);
    view.setUint32(entry + 12, offset, true);
    new Uint8Array(buffer, offset, layer.bytes.length).set(layer.bytes);
    offset += layer.bytes.length;
  });
  return new Blob([buffer], { type: "image/x-icon" });
}

export async function readIco(file: Blob) {
  const buffer = await file.arrayBuffer();
  const view = new DataView(buffer);
  if (view.byteLength < 6 || view.getUint16(0, true) !== 0 || view.getUint16(2, true) !== 1) throw new Error("This is not a valid ICO file.");
  const count = view.getUint16(4, true);
  if (!count || view.byteLength < 6 + count * 16) throw new Error("This ICO has no readable layers.");
  return Array.from({ length: count }, (_, index) => {
    const entry = 6 + index * 16;
    const width = view.getUint8(entry) || 256, height = view.getUint8(entry + 1) || 256;
    const size = view.getUint32(entry + 8, true), offset = view.getUint32(entry + 12, true);
    if (offset + size > view.byteLength) throw new Error("This ICO contains a damaged layer.");
    const bytes = new Uint8Array(buffer, offset, size);
    const png = bytes.length >= 8 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47;
    return { width, height, bits: view.getUint16(entry + 6, true), format: png ? "PNG" : "BMP", blob: new Blob([bytes], { type: png ? "image/png" : "application/octet-stream" }) };
  });
}
