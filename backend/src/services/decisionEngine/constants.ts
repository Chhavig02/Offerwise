/**
 * Decision Engine Constants & Thresholds
 * 
 * This module centralizes all numerical thresholds and heuristic weights 
 * used by the Offer Decision Engine to determine recommendations.
 */

// ---------------------------------------------------------
// SCORE THRESHOLDS
// ---------------------------------------------------------
// The Offerwise Score operates on a 0-100 scale.
// A score below this indicates severe, compounding contractual risks 
// that fundamentally compromise the safety of the offer.
export const THRESHOLD_REJECT_SCORE = 50;

// A score below this indicates significant contractual risks that 
// MUST be addressed before signing, moving the baseline to NEGOTIATE.
export const THRESHOLD_NEGOTIATE_SCORE = 85;

// ---------------------------------------------------------
// MARKET COMPENSATION THRESHOLDS
// ---------------------------------------------------------
// Percentage ratio (0.0 to 1.0+). 
// If the fixed salary is below this ratio of the market median, it becomes a negotiation priority.
// e.g., 0.90 means if salary is < 90% of median, flag for negotiation.
// We use 0.95 to account for slight market variations while still flagging lowball offers.
export const THRESHOLD_BELOW_MARKET_RATIO = 0.95;

// ---------------------------------------------------------
// RISK & GAP THRESHOLDS
// ---------------------------------------------------------
// Number of critical information gaps that trigger an automatic NEEDS_MORE_INFORMATION.
// A single critical gap (like missing salary entirely) is enough.
export const THRESHOLD_CRITICAL_GAPS = 1;

// If an offer has this many HIGH severity risks, it automatically forces a NEGOTIATE recommendation 
// regardless of compensation.
export const THRESHOLD_HIGH_RISK_COUNT = 1;
