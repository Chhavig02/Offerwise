import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import request from 'supertest';
import app from '../server';
import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { prisma } from '../lib/prisma';
import { admin } from '../lib/firebase-admin';

// Mock documentService to bypass pdf-parse vitest CJS issues
vi.mock('../services/documentService', () => {
  return {
    extractDocumentTextFromBuffer: vi.fn().mockResolvedValue({
      text: 'Offer Letter\nCompany: Example Technologies\nRole: Software Engineer\nLocation: Bengaluru\nCTC: Rs 10,00,000\nFixed: Rs 7,00,000\nVariable: Rs 3,00,000\nNotice Period: 90 days',
      mimeType: 'application/pdf'
    }),
    normalizeExtractedText: (text: string) => text
  };
});

// Mock Firebase Admin Auth
vi.mock('../lib/firebase-admin', () => {
  return {
    admin: {
      auth: () => ({
        verifyIdToken: vi.fn().mockResolvedValue({ uid: 'synthetic_user_123' })
      })
    }
  };
});

// Ensure E2E test hits the real Gemini API
process.env.AI_PROVIDER = 'gemini';

describe('POST /api/offers/upload - End to End Synthetic Test', () => {
  let syntheticPdfBuffer: Buffer;

  beforeAll(async () => {
    // Generate synthetic PDF in memory
    syntheticPdfBuffer = await new Promise<Buffer>((resolve) => {
      const doc = new PDFDocument();
      const buffers: Buffer[] = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => resolve(Buffer.concat(buffers)));

      doc.fontSize(16).text('Offer Letter');
      doc.moveDown();
      doc.fontSize(12).text('Company: Example Technologies');
      doc.text('Role: Software Engineer');
      doc.text('Location: Bengaluru');
      doc.text('CTC: Rs 10,00,000');
      doc.text('Fixed: Rs 7,00,000');
      doc.text('Variable: Rs 3,00,000');
      doc.text('Notice Period: 90 days');
      
      // Deliberately omitted: insurance, probation period, relocation policy
      
      doc.end();
    });
  });

  afterAll(async () => {
    // Cleanup DB in correct order to respect FK constraints
    const offers = await prisma.offer.findMany({ where: { userId: 'synthetic_user_123' } });
    const offerIds = offers.map(o => o.id);
    await prisma.offerAnalysis.deleteMany({ where: { offerId: { in: offerIds } } });
    await prisma.offer.deleteMany({ where: { userId: 'synthetic_user_123' } });
    await prisma.user.deleteMany({ where: { id: 'synthetic_user_123' } });
    
    // Cleanup Local Storage
    const userDir = path.join(process.cwd(), 'uploads', 'synthetic_user_123');
    if (fs.existsSync(userDir)) {
      fs.rmSync(userDir, { recursive: true, force: true });
    }
  });

  it('should process the synthetic offer letter and generate appropriate flags', async () => {
    const response = await request(app)
      .post('/api/offers/upload')
      .set('Authorization', 'Bearer fake_jwt_token')
      .attach('document', syntheticPdfBuffer, {
        filename: 'synthetic_offer.pdf',
        contentType: 'application/pdf'
      });

    // Verify HTTP Response
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    
    const analysis = response.body.data;
    expect(analysis).toBeDefined();

    // Verify extracted data properties (mocked rules engine checks)
    // The rules engine adds flags based on validated data
    const infoGaps = analysis.information_gaps || [];
    const risks = analysis.flags || [];

    // Insurance omitted -> Information Gap
    const hasInsuranceGap = infoGaps.some((f: any) => f.title.toLowerCase().includes('insurance'));
    if (!hasInsuranceGap) {
      console.log('INFO GAPS FOUND:', infoGaps);
      console.log('ALL FLAGS:', response.body.data.flags);
      console.log('RAW DATA:', response.body.data.extractedData);
    }
    expect(hasInsuranceGap).toBe(true);

    // Probation omitted -> Information Gap
    const hasProbationGap = infoGaps.some((f: any) => f.title.toLowerCase().includes('probation'));
    expect(hasProbationGap).toBe(true);

    // 90 days Notice Period -> Risk
    const hasNoticeRisk = risks.some((f: any) => f.title.toLowerCase().includes('notice'));
    expect(hasNoticeRisk).toBe(true);

    // Verify DB Persistence
    const dbOffer = await prisma.offer.findFirst({
      where: { userId: 'synthetic_user_123' }
    });
    expect(dbOffer).not.toBeNull();
    
    const dbAnalysis = await prisma.offerAnalysis.findFirst({
      where: { offerId: dbOffer!.id }
    });
    expect(dbAnalysis).not.toBeNull();
    
    // Verify File Storage
    const expectedFilePath = path.join(process.cwd(), 'uploads', 'synthetic_user_123', `${dbOffer!.id}.pdf`);
    expect(fs.existsSync(expectedFilePath)).toBe(true);
  }, 45000); // this request now also triggers real company research (2 Tavily calls) on top of the Gemini call
});
