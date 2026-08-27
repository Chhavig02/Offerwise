/**
 * Shared instruction text for offer-letter structured extraction, used by
 * every AI provider (GeminiProvider, GroqProvider) so they're given
 * identical instructions -- factored out here specifically to avoid the
 * two providers' prompts drifting out of sync if edited in only one place.
 */
export function buildOfferExtractionPrompt(documentText: string): string {
  return `
You are an expert employment lawyer and data extraction engine.
Extract the details of the following employment offer letter/contract.
CRITICAL INSTRUCTION: If a fact is NOT explicitly written in the document, you MUST set status to "not_specified" and value to null.
Do not assume, infer, or guess.
Extract only information explicitly supported by the offer letter. Do not infer location, work mode, or experience level.
"hasRelocation" means whether the offer mentions relocation being required or relocation expenses being covered at all, regardless of whether a specific amount is given. "relocationAllowance" is only the specific reimbursement amount, if one is explicitly stated -- set it to not_specified if relocation is mentioned but no amount is given.
Return exactly the structured JSON schema requested.

Document Text:
${documentText}
  `;
}
