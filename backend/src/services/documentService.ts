import * as mammoth from 'mammoth';

export interface ExtractedDocument {
  text: string;
  mimeType: string;
}

export async function extractDocumentTextFromBuffer(buffer: Buffer, mimeType: string): Promise<ExtractedDocument> {
  const contentType = mimeType.toLowerCase();
  let text: string;

  if (contentType.includes('application/pdf')) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { PDFParse } = require('pdf-parse');
    const parser = new PDFParse({ data: buffer });
    try {
      const result = await parser.getText();
      text = result.text;
    } finally {
      await parser.destroy();
    }
  } else if (
    contentType.includes('application/vnd.openxmlformats-officedocument.wordprocessingml.document') ||
    contentType.includes('application/msword')
  ) {
    const result = await mammoth.extractRawText({ buffer });
    text = result.value;
  } else {
    // Unsupported image or other format for local text extraction MVP
    throw new Error('Unsupported document format for text extraction. Only PDF and DOCX are currently supported.');
  }

  // Clean up excessive whitespace
  text = text.replace(/\s+/g, ' ').trim();

  return { text, mimeType: contentType };
}

/**
 * Normalizes common currency extraction corruptions (e.g. n9,60,000 -> Rs. 9,60,000).
 * Matches single-letter prefixes (like 'n') followed by an Indian/standard number pattern.
 */
export function normalizeExtractedText(text: string): string {
  return text.replace(/\b[a-zA-Z](?=(?:\d{1,3}(?:,\d{2,3})+|\d{5,})\b)/g, 'Rs. ');
}
