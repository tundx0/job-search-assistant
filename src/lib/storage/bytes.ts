/**
 * Convert an AWS SDK v3 GetObject body into raw bytes.
 * Prefer transformToByteArray so PDFs are not UTF-8 decoded.
 */
export async function sdkBodyToBuffer(body: {
  transformToByteArray?: () => Promise<Uint8Array>;
  [Symbol.asyncIterator]?: () => AsyncIterator<Uint8Array | Buffer | string>;
}): Promise<Buffer> {
  if (typeof body.transformToByteArray === "function") {
    return Buffer.from(await body.transformToByteArray());
  }

  if (typeof body[Symbol.asyncIterator] === "function") {
    const chunks: Buffer[] = [];
    for await (const chunk of body as AsyncIterable<Uint8Array | Buffer | string>) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    return Buffer.concat(chunks);
  }

  throw new Error("Unsupported storage response body");
}
