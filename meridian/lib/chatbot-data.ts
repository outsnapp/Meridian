import type { Department } from "./department-context"

type CardId = "biosimilar-entry" | "medicare-reimbursement"

export interface SuggestedQuestion {
  question: string
  answer: string
}

const questions: Record<
  CardId,
  Record<Department, SuggestedQuestion[]>
> = {
  "biosimilar-entry": {
    executive: [
      {
        question: "What is the realistic revenue exposure if we delay repricing by 60 days?",
        answer:
          "Based on EU5 biosimilar adoption curves, a 60-day delay in defensive repricing typically results in an additional 3-5% volume erosion on top of the baseline 15-20% first-year loss. For a $340M annual revenue base, that translates to $10-17M in incremental risk. Germany and France move fastest on formulary switches, so the exposure concentrates there.",
      },
      {
        question: "Which portfolio products are most insulated from biosimilar switching?",
        answer:
          "Products with complex administration protocols, established patient support programs, and differentiated safety profiles tend to retain 80-85% of their volume through the first 18 months. Within the oncology portfolio, the IV-administered products with established infusion center relationships show the strongest retention rates.",
      },
      {
        question: "Should we consider a proactive biosimilar licensing strategy?",
        answer:
          "Authorized biosimilar strategies have shown mixed results. The key variable is whether your market share erosion would exceed the royalty income. Given the projected 12.4% revenue impact, a licensing arrangement could recover 3-4% of lost revenue while maintaining some pricing discipline in the market.",
      },
    ],
    finance: [
      {
        question: "What are the three scenario outcomes for Q4 earnings impact?",
        answer:
          "Slow adoption: 4-6% revenue decline, $14-20M impact, Q4 guidance achievable with minor revision. Moderate adoption: 8-10% decline, $27-34M impact, guidance miss likely without preemptive adjustment. Rapid adoption (INN mandates): 12-14% decline, $41-48M impact, requires immediate guidance revision and analyst communication.",
      },
      {
        question: "How does the biosimilar entry affect our FX hedging position?",
        answer:
          "The EUR-denominated revenue at risk is approximately EUR 310M. If volume loss materializes faster than expected, existing FX hedges could become over-hedged, creating mark-to-market exposure. Recommend reviewing the hedge ratio with treasury to align with the moderate adoption scenario as the base case.",
      },
      {
        question: "What is the margin impact of defensive rebate strategies?",
        answer:
          "Defensive rebates in the 8-12% range typically preserve 85-90% of volume but compress gross margins by 300-500 basis points on affected SKUs. Net-net, the revenue preservation outweighs the margin compression at volumes above the break-even threshold of approximately 70% volume retention.",
      },
    ],
    commercial: [
      {
        question: "Which accounts are at highest risk of switching in Q1?",
        answer:
          "The top-10 risk accounts are concentrated in Germany (University Hospital networks with centralized procurement) and the Nordics (national tender-driven systems). Accounts with contract renewals in the next 90 days and those where the biosimilar's target price undercuts current list by >15% represent the immediate vulnerability zone.",
      },
      {
        question: "What bundling strategies have worked best against prior biosimilar entries?",
        answer:
          "Cross-portfolio bundling that ties oncology pricing to immunology or rare disease volume commitments has shown 60-70% success rates in retaining accounts. Single-product rebates alone typically only delay switching by 3-6 months. The most effective bundles include value-added services like patient support programs and outcomes monitoring.",
      },
      {
        question: "How should field teams prioritize their response in the first 30 days?",
        answer:
          "Tier 1 (Days 1-10): Top-20 accounts with active contract renewals -- secure term extensions. Tier 2 (Days 11-20): High-volume accounts without near-term renewals -- introduce bundling proposals. Tier 3 (Days 21-30): Mid-volume accounts in biosimilar-friendly markets -- deploy value-add differentiation messaging.",
      },
    ],
    "market-access": [
      {
        question: "What is the typical HTA reassessment timeline after biosimilar approval?",
        answer:
          "NICE typically initiates a technology appraisal review within 6-9 months of biosimilar approval. G-BA's benefit assessment begins within 3-6 months. TLV in Sweden and ZIN in the Netherlands generally follow within 9-12 months. The UK and Germany timelines are the most critical given their influence on subsequent EU markets.",
      },
      {
        question: "What real-world evidence endpoints should we prioritize in the NICE submission?",
        answer:
          "NICE has historically weighted three categories: long-term safety data (>3 years), switching/immunogenicity studies, and patient-reported outcomes. Endpoint priorities should be: 1) Immunogenicity comparison data, 2) Treatment persistence and switching outcomes, 3) Long-term safety in elderly populations, 4) Healthcare resource utilization comparisons.",
      },
      {
        question: "Can we influence the reference pricing framework before the reassessment?",
        answer:
          "Yes, through early engagement with the assessment bodies. Submitting a pre-assessment briefing document to NICE and requesting a scoping meeting with G-BA can help frame the evaluation criteria before the biosimilar's dossier enters review. The window for this is typically the first 90 days post-authorization.",
      },
    ],
  },
  "medicare-reimbursement": {
    executive: [
      {
        question: "Which immunology products qualify for the enhanced reimbursement?",
        answer:
          "Three products in the current portfolio meet the high-efficacy threshold under the proposed criteria: the IL-17 inhibitor (dermatology), the JAK inhibitor (rheumatology), and the anti-TNF biologic (multi-indication). Together these represent approximately $1.2B in annual US revenue, making the 4-7% uplift worth $48-84M in incremental margin.",
      },
      {
        question: "How sustainable is this reimbursement advantage?",
        answer:
          "CMS reimbursement methodology changes typically persist through at least one full rulemaking cycle (2-3 years). However, the advantage is most potent in the first 12-18 months before competitors adjust their positioning. Historical ASP adjustment patterns suggest the policy direction is durable, but the competitive window for first-mover positioning is narrow.",
      },
      {
        question: "Should we accelerate any pipeline launches to capitalize on the timing?",
        answer:
          "The Phase III immunology candidate in dermatology is the strongest candidate for acceleration. If the launch timeline can be pulled forward by 2-3 months to coincide with the Q1 2025 reimbursement effective date, the product would enter the market with a built-in reimbursement narrative. This requires a board-level decision within 3 weeks.",
      },
    ],
    finance: [
      {
        question: "How should we model the ASP uplift across the immunology portfolio?",
        answer:
          "The revised ASP methodology applies a 5% add-on for qualifying high-efficacy biologics. Model this as: Base ASP + 5% efficacy premium + standard quarterly ASP adjustments. For the three qualifying products, this yields incremental revenue of $48-84M annually, with the highest impact on the IL-17 inhibitor due to its Medicare-heavy patient mix.",
      },
      {
        question: "What is the working capital impact of improved reimbursement certainty?",
        answer:
          "Improved provider reimbursement certainty reduces billing disputes and claim denials, which historically account for 4-6% of Medicare-related bad debt. Modeling suggests an 8-12 day improvement in DSO on affected product lines, freeing approximately $15-22M in working capital over the first 12 months.",
      },
      {
        question: "Are there downside scenarios where the reimbursement change gets reversed?",
        answer:
          "The primary risk is a CMS final rule that narrows the eligibility criteria. Based on comment period dynamics, there is a 15-20% probability of material narrowing. The downside scenario should model a partial uplift (2-3% instead of 5%) affecting only one of the three qualifying products. Budget accordingly with a risk-weighted expected value.",
      },
    ],
    commercial: [
      {
        question: "Which physician segments are most responsive to reimbursement messaging?",
        answer:
          "Community-based rheumatologists and dermatologists in solo or small-group practices show the highest sensitivity to reimbursement changes -- 2.3x more likely to adjust prescribing than academic medical center physicians. Target accounts with >40% Medicare patient mix and current prescription volumes below portfolio average for maximum conversion potential.",
      },
      {
        question: "How should the reimbursement calculator be structured for field use?",
        answer:
          "The calculator should show three views: 1) Per-patient annual reimbursement comparison (old vs. new methodology), 2) Practice-level revenue impact based on their Medicare patient volume, 3) Simplified billing workflow comparison. Real-dollar amounts are 3x more effective than percentage-based messaging in physician detail meetings.",
      },
      {
        question: "What competitive messaging should we prepare?",
        answer:
          "Lead with the reimbursement certainty narrative rather than the dollar amount alone. Key message: 'Our product now carries a CMS-recognized efficacy premium that directly improves your reimbursement.' Counter-messaging for biosimilar competitors: emphasize that biosimilars do not qualify for the high-efficacy premium under the current proposed methodology.",
      },
    ],
    "market-access": [
      {
        question: "How does this affect our PBM negotiating position?",
        answer:
          "The CMS methodology change strengthens your position by establishing a federal benchmark for the product's reimbursement value. PBMs will have less leverage to push for deeper rebates when the CMS payment rate explicitly recognizes higher efficacy. Use the updated ASP as the anchor point in all upcoming formulary negotiations.",
      },
      {
        question: "Should we submit comments during the CMS public comment period?",
        answer:
          "Yes, this is strategically important. Your comment should support the methodology while advocating for: 1) Clear definition of 'high-efficacy' criteria that your products meet, 2) Inclusion of real-world evidence as a qualifying metric, 3) Extension of the premium to biosimilar-reference products to maintain competitive positioning.",
      },
      {
        question: "Which formulary submissions should be prioritized for revision?",
        answer:
          "Prioritize in this order: 1) CVS Health/Aetna -- formulary review cycle closes in 30 days, 2) Express Scripts/Cigna -- mid-year update window opens in 45 days, 3) OptumRx/UnitedHealth -- annual review submission deadline in 60 days. Each submission should reference the CMS proposed rule as supporting evidence for preferred formulary placement.",
      },
    ],
  },
}

export function getSuggestedQuestions(
  cardId: CardId | null,
  department: Department,
): SuggestedQuestion[] {
  if (!cardId) return []
  return questions[cardId]?.[department] ?? []
}

export function getCardTitle(cardId: CardId | null): string {
  if (cardId === "biosimilar-entry")
    return "Competitive Entry: Biosimilar Approval in EU"
  if (cardId === "medicare-reimbursement")
    return "Medicare Part B Reimbursement Shift"
  return ""
}

export function getCardSignalType(
  cardId: CardId | null,
): "Risk" | "Opportunity" | null {
  if (cardId === "biosimilar-entry") return "Risk"
  if (cardId === "medicare-reimbursement") return "Opportunity"
  return null
}
