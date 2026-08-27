import { NormalizedOfferData } from '@/types';

export async function extractOfferDataMock(_documentUrl: string): Promise<NormalizedOfferData> {
  console.log('Mock extracting from:', _documentUrl);
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 2000));

  return {
    companyName: {
      value: 'Acme Corp',
      status: 'found',
      confidence: 0.95,
      evidence: { sourceText: 'Welcome to Acme Corp', sourcePage: 1, sourceLocation: 'Header' }
    },
    candidateName: {
      value: 'John Doe',
      status: 'found',
      confidence: 0.99,
      evidence: { sourceText: 'Dear John Doe,', sourcePage: 1, sourceLocation: 'Greeting' }
    },
    role: {
      value: 'Software Engineer',
      status: 'found',
      confidence: 0.9,
      evidence: { sourceText: 'position of Software Engineer', sourcePage: 1, sourceLocation: 'Paragraph 1' }
    },
    fixedSalary: {
      value: 1200000,
      status: 'found',
      confidence: 0.95,
      evidence: { sourceText: 'Base salary of INR 12,00,000 per annum', sourcePage: 2, sourceLocation: 'Compensation Schedule' }
    },
    variableSalary: {
      value: 200000,
      status: 'found',
      confidence: 0.85,
      evidence: { sourceText: 'Performance bonus up to INR 2,00,000', sourcePage: 2, sourceLocation: 'Compensation Schedule' }
    },
    joiningBonus: {
      value: null,
      status: 'not_specified',
      confidence: 1.0,
      evidence: { sourceText: null, sourcePage: null, sourceLocation: null }
    },
    currency: {
      value: 'INR',
      status: 'found',
      confidence: 1.0,
      evidence: { sourceText: 'INR 12,00,000', sourcePage: 2, sourceLocation: 'Compensation Schedule' }
    },
    probationPeriodMonths: {
      value: 6,
      status: 'found',
      confidence: 0.9,
      evidence: { sourceText: 'Probation period of 6 months', sourcePage: 3, sourceLocation: 'Terms and Conditions' }
    },
    noticePeriodDays: {
      value: null, // Proving invariant: missing data = null
      status: 'not_specified',
      confidence: 1.0,
      evidence: { sourceText: null, sourcePage: null, sourceLocation: null }
    },
    hasBond: {
      value: true,
      status: 'found',
      confidence: 0.9,
      evidence: { sourceText: 'Mandatory service of 1 year', sourcePage: 4, sourceLocation: 'Annexure A' }
    },
    bondDurationMonths: {
      value: 12,
      status: 'found',
      confidence: 0.9,
      evidence: { sourceText: 'Mandatory service of 1 year', sourcePage: 4, sourceLocation: 'Annexure A' }
    },
    bondBuyoutAmount: {
      value: null,
      status: 'not_specified',
      confidence: 1.0,
      evidence: { sourceText: null, sourcePage: null, sourceLocation: null }
    },
    hasNonCompete: {
      value: true,
      status: 'found',
      confidence: 0.9,
      evidence: { sourceText: 'Cannot work for competitors for 6 months after termination', sourcePage: 5, sourceLocation: 'Non-Compete Clause' }
    },
    location: {
      value: 'Bengaluru',
      status: 'found',
      confidence: 0.9,
      evidence: { sourceText: 'based at our Bengaluru office', sourcePage: 1, sourceLocation: 'Location' }
    },
    workMode: {
      value: 'hybrid',
      status: 'found',
      confidence: 0.85,
      evidence: { sourceText: 'Hybrid work model', sourcePage: 1, sourceLocation: 'Work Arrangement' }
    },
    experienceLevel: {
      value: 'entry',
      status: 'found',
      confidence: 0.85,
      evidence: { sourceText: 'Graduate Software Engineer', sourcePage: 1, sourceLocation: 'Position' }
    }
  };
}
