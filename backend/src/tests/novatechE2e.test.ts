import dotenv from 'dotenv';
dotenv.config();

import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { extractDocumentTextFromBuffer } from '../services/documentService';
import { runAnalysisPipeline } from '../services/pipeline';

describe('NovaTech Offer Real Document Pipeline E2E', () => {
  it('processes the actual novatech_offer.pdf and returns grounded structured data', async () => {
    const pdfPath = path.join(process.cwd(), '..', 'novatech_offer.pdf');
    expect(fs.existsSync(pdfPath)).toBe(true);

    const pdfBuffer = fs.readFileSync(pdfPath);
    const { text, mimeType } = await extractDocumentTextFromBuffer(pdfBuffer, 'application/pdf');
    expect(text).toContain('NovaTech');

    // Run full pipeline
    const result = await runAnalysisPipeline(pdfBuffer, mimeType, 'novatech-real-audit-id');
    expect(result).toBeDefined();
    expect(result.score).toBeGreaterThan(0);
    expect(result.score).toBeLessThanOrEqual(100);

    const ext = result.extracted_data;
    expect(ext).toBeDefined();

    // Verify company name extraction
    expect(ext?.companyName.value).toMatch(/NovaTech/i);
    expect(ext?.companyName.status).toBe('found');

    // Verify role
    expect(ext?.role.value).toMatch(/Software Engineer/i);
    expect(ext?.role.status).toBe('found');

    // Verify salary numbers
    expect(ext?.fixedSalary.value).toBe(900000);
    expect(ext?.variableSalary.value).toBe(300000);
    expect(ext?.joiningBonus.value).toBe(50000);

    // Verify contractual terms
    expect(ext?.probationPeriodMonths.value).toBe(6);
    expect(ext?.noticePeriodDays.value).toBe(90); // 90 days after probation
    expect(ext?.hasBond.value).toBe(true);
    expect(ext?.bondDurationMonths.value).toBe(18);
    expect(ext?.bondBuyoutAmount.value).toBe(150000);
    expect(ext?.hasNonCompete.value).toBe(true);

    // Verify score is backend-derived (100 - risk penalties)
    const riskPenalties = result.flags
      .filter(f => f.type === 'risk')
      .reduce((sum, f) => sum + (f.scoreImpact || 0), 0);
    expect(result.score).toBe(Math.max(0, 100 - riskPenalties));
  }, 45000);
});
