import type { LegacyDepartment } from "./department-context"

export interface RecommendationSection {
  label: string
  content: string
}

export interface Recommendation {
  sections: RecommendationSection[]
  confidence: string
}

type CardId = "biosimilar-entry" | "medicare-reimbursement"

function r(
  sections: [string, string][],
  confidence: string,
): Recommendation {
  return {
    sections: sections.map(([label, content]) => ({ label, content })),
    confidence,
  }
}

const recommendations: Record<CardId, Record<LegacyDepartment, Recommendation>> = {
  "biosimilar-entry": {
    executive: r(
      [
        [
          "PRIMARY OUTCOME",
          "Protect an estimated $340M in annual EU oncology revenue by securing formulary position before Q3 lock-in windows close.",
        ],
        [
          "WHAT'S CHANGING",
          "EMA authorization of X-Bio's biosimilar creates a 6-to-9-month window before meaningful market erosion begins. Historical precedent from prior biosimilar entries in the EU5 shows reference products lose 15-20% volume share within the first 12 months when defensive repricing is delayed past formulary decision cycles.",
        ],
        [
          "WHY IT MATTERS",
          "Delaying action past Q2 risks ceding market share that is structurally difficult to recover once biosimilar substitution becomes the default in national tender processes. Bundling strategies across the oncology portfolio can further insulate against single-product switching pressure.",
        ],
        [
          "WHAT TO DO NOW",
          "Initiate immediate repricing in Germany, France, and Italy. Accelerate value-based agreements that lock in volume commitments from key hospital and specialty pharmacy accounts.",
        ],
        [
          "DECISION URGENCY",
          "High -- EU formulary lock-in windows close within 90 days; delayed response risks irreversible volume loss in Germany, France, and Italy.",
        ],
        [
          "RECOMMENDED NEXT STEP",
          "Convene a cross-functional war room within 5 business days to finalize the EU pricing corridor and competitive response playbook.",
        ],
        [
          "ASSUMPTIONS & SIGNALS",
          "Based on EMA authorization timelines, EU5 biosimilar adoption curves from 2018-2024, and historical reference product erosion patterns in oncology.",
        ],
      ],
      "High -- supported by prior EU oncology biosimilar launches and current field intelligence from 5 markets.",
    ),
    finance: r(
      [
        [
          "PRIMARY OUTCOME",
          "Model a 12.4% revenue reduction across EU oncology and stress-test Q4 guidance before the next earnings cycle.",
        ],
        [
          "WHAT'S CHANGING",
          "EMA authorization of X-Bio's biosimilar introduces direct margin pressure across the EU oncology portfolio. Preliminary sensitivity analysis suggests 8-14% gross margin compression on affected SKUs, with cascading effects on full-year EBITDA.",
        ],
        [
          "WHY IT MATTERS",
          "Failure to adjust forecasts ahead of Q3 close creates a material risk of guidance miss, particularly given sell-side consensus has not yet priced in the biosimilar entry.",
        ],
        [
          "WHAT TO DO NOW",
          "Run downside scenario modeling incorporating three adoption curves: slow (regulatory friction delays uptake 6+ months), moderate (standard biosimilar trajectory), and rapid (immediate INN prescribing mandates in key markets).",
        ],
        [
          "DECISION URGENCY",
          "High -- Q3 close is 6 weeks out; failing to adjust forecasts now risks a material guidance miss and analyst downgrade.",
        ],
        [
          "RECOMMENDED NEXT STEP",
          "Run updated P&L scenarios under three adoption curves (slow, moderate, rapid) and brief the CFO by end of week.",
        ],
        [
          "ASSUMPTIONS & SIGNALS",
          "Based on EMA regulatory data, historical biosimilar pricing trajectories in EU5 markets, and internal margin sensitivity models.",
        ],
      ],
      "High -- grounded in EMA regulatory data and validated against historical EU5 biosimilar pricing trajectories.",
    ),
    commercial: r(
      [
        [
          "PRIMARY OUTCOME",
          "Lock in top-20 EU accounts with value-add contracting before biosimilar commercial teams begin payer outreach.",
        ],
        [
          "WHAT'S CHANGING",
          "Biosimilar commercial teams typically begin KOL engagement and payer outreach within 60 days of marketing authorization. The window for pre-emptive account defense is narrow and closing.",
        ],
        [
          "WHY IT MATTERS",
          "Field intelligence suggests X-Bio is targeting the same high-volume hospital networks. Speed of execution is the primary competitive advantage at this stage. Germany and the Nordics present the highest near-term switching risk.",
        ],
        [
          "WHAT TO DO NOW",
          "Front-load rebate renegotiations, therapeutic bundling offers, and extended-term volume commitments with the top-20 EU accounts. Prioritize accounts where current contract renewals fall within the next two quarters.",
        ],
        [
          "DECISION URGENCY",
          "High -- biosimilar commercial teams are expected to begin payer outreach within 60 days; first-mover advantage in contracting erodes rapidly.",
        ],
        [
          "RECOMMENDED NEXT STEP",
          "Deploy updated pricing matrix and contracting playbook to EU field teams within 10 business days, prioritizing Germany, France, and Nordics.",
        ],
        [
          "ASSUMPTIONS & SIGNALS",
          "Based on biosimilar launch sequencing data, EU5 tender calendars, and competitive intelligence on X-Bio's go-to-market timeline.",
        ],
      ],
      "High -- corroborated by field intelligence and EU5 tender calendar analysis.",
    ),
    "market-access": r(
      [
        [
          "PRIMARY OUTCOME",
          "Pre-empt HTA reassessment outcomes by filing supplementary real-world evidence with NICE and G-BA within 30 days.",
        ],
        [
          "WHAT'S CHANGING",
          "Biosimilar approvals in the EU trigger mandatory HTA reassessment in several markets within 12 months. In the UK and Germany, the evaluation window typically opens 4-6 months post-authorization.",
        ],
        [
          "WHY IT MATTERS",
          "Early engagement with NICE and G-BA can shape the evaluation framework in ways that favor the originator -- particularly around switching-risk endpoints, long-term safety profiles, and immunogenicity data that biosimilars cannot yet match.",
        ],
        [
          "WHAT TO DO NOW",
          "Prepare and submit supplementary evidence packages emphasizing long-term safety, switching-risk data, and immunogenicity profiles to NICE and G-BA.",
        ],
        [
          "DECISION URGENCY",
          "Moderate-High -- HTA reassessment timelines in the UK and Germany typically begin within 6 months of biosimilar approval; early filings set the evidentiary baseline.",
        ],
        [
          "RECOMMENDED NEXT STEP",
          "Submit pre-emptive evidence packages to NICE and G-BA within 30 days, emphasizing long-term safety, switching-risk data, and immunogenicity profiles.",
        ],
        [
          "ASSUMPTIONS & SIGNALS",
          "Based on NICE and G-BA procedural timelines, EU pharmacovigilance reporting requirements, and published HTA evaluation frameworks for biosimilar assessments.",
        ],
      ],
      "Moderate-High -- anchored in published NICE/G-BA procedural timelines and EU pharmacovigilance reporting cadences.",
    ),
  },
  "medicare-reimbursement": {
    executive: r(
      [
        [
          "PRIMARY OUTCOME",
          "Capture a projected 4-7% margin uplift in immunology by repositioning the portfolio ahead of Q1 2025 reimbursement changes.",
        ],
        [
          "WHAT'S CHANGING",
          "The proposed 5% Part B reimbursement increase for high-efficacy biologics directly favors three products in the immunology portfolio. This is a narrow policy window.",
        ],
        [
          "WHY IT MATTERS",
          "The firms that embed the reimbursement advantage into their value story first will capture disproportionate share in rheumatology and dermatology, where physician sensitivity to reimbursement signals is highest.",
        ],
        [
          "WHAT TO DO NOW",
          "Align pricing, launch sequencing, and payer messaging to the new framework. Delaying past the Q1 effective date forfeits the first-mover narrative.",
        ],
        [
          "DECISION URGENCY",
          "Moderate -- the reimbursement update takes effect Q1 2025; early positioning secures first-mover advantage in payer negotiations.",
        ],
        [
          "RECOMMENDED NEXT STEP",
          "Task the strategy team with a 2-week sprint to deliver a portfolio repositioning plan aligned with the new reimbursement framework.",
        ],
        [
          "ASSUMPTIONS & SIGNALS",
          "Based on CMS proposed rulemaking, historical ASP adjustment patterns in biologics, and competitive immunology landscape analysis.",
        ],
      ],
      "Moderate -- based on CMS proposed rulemaking; subject to final rule confirmation and eligibility criteria.",
    ),
    finance: r(
      [
        [
          "PRIMARY OUTCOME",
          "Revise immunology revenue forecasts upward by 4-7% for FY2025 and incorporate improved cash conversion from reduced bad-debt exposure.",
        ],
        [
          "WHAT'S CHANGING",
          "The Part B reimbursement shift creates a direct top-line tailwind for qualifying biologics. Updated ASP calculations should reflect the revised payment methodology for three immunology products meeting the high-efficacy threshold.",
        ],
        [
          "WHY IT MATTERS",
          "Beyond revenue, the reimbursement update reduces bad-debt exposure on Medicare claims by improving provider reimbursement certainty. Early modeling suggests an 8-12 day improvement in cash conversion cycle.",
        ],
        [
          "WHAT TO DO NOW",
          "Incorporate revised ASP assumptions into the FY2025 revenue model before the planning cycle closes in 4 weeks.",
        ],
        [
          "DECISION URGENCY",
          "Moderate -- FY2025 guidance preparation begins in 4 weeks; revised ASP assumptions must be incorporated before the planning cycle closes.",
        ],
        [
          "RECOMMENDED NEXT STEP",
          "Update FY2025 revenue model with revised ASP assumptions and circulate to finance leadership for Q1 guidance review.",
        ],
        [
          "ASSUMPTIONS & SIGNALS",
          "Based on CMS Federal Register notices, Medicare Part B payment methodology documentation, and internal revenue modeling benchmarks.",
        ],
      ],
      "Moderate -- derived from CMS Federal Register notices and internal revenue modeling benchmarks.",
    ),
    commercial: r(
      [
        [
          "PRIMARY OUTCOME",
          "Equip field teams with updated reimbursement messaging to drive 10-15% higher conversion in underpenetrated Medicare accounts.",
        ],
        [
          "WHAT'S CHANGING",
          "Physicians are highly responsive to reimbursement changes that reduce patient out-of-pocket burden and simplify billing workflows. The Part B update creates a compelling new value narrative for immunology biologics.",
        ],
        [
          "WHY IT MATTERS",
          "Embedding the reimbursement advantage into the sales narrative -- with specific dollar-amount impact on provider economics -- can drive 10-15% higher conversion in underpenetrated accounts where cost concerns have historically been the primary barrier.",
        ],
        [
          "WHAT TO DO NOW",
          "Develop updated detail aids and a reimbursement calculator that quantifies provider economics improvements for the immunology portfolio.",
        ],
        [
          "DECISION URGENCY",
          "Moderate -- the next major selling cycle begins in 6 weeks; field teams need updated materials before payer discussions resume.",
        ],
        [
          "RECOMMENDED NEXT STEP",
          "Roll out updated detail aid and reimbursement calculator to the full field team before the next selling cycle begins.",
        ],
        [
          "ASSUMPTIONS & SIGNALS",
          "Based on CMS reimbursement data, physician prescribing behavior studies in Medicare populations, and competitive biosimilar positioning in rheumatology and dermatology.",
        ],
      ],
      "Moderate -- supported by physician prescribing behavior studies in Medicare populations and CMS reimbursement data.",
    ),
    "market-access": r(
      [
        [
          "PRIMARY OUTCOME",
          "Align all pending formulary submissions to the new Part B reimbursement methodology within 21 days to strengthen payer negotiations.",
        ],
        [
          "WHAT'S CHANGING",
          "CMS's reimbursement shift signals a broader policy direction favoring innovation in high-efficacy biologics. This creates an opportunity to reframe product value in terms that directly reference the CMS methodology.",
        ],
        [
          "WHY IT MATTERS",
          "Proactively aligning formulary submissions with the new payment methodology strengthens the negotiating position across all major PBMs and Medicare Advantage plans. The CMS public comment window is time-limited and strategically valuable.",
        ],
        [
          "WHAT TO DO NOW",
          "Revise all pending payer submissions to reference the updated Part B framework. Prepare a CMS comment letter to help shape supplementary coverage guidance.",
        ],
        [
          "DECISION URGENCY",
          "Moderate -- upcoming formulary submission deadlines for major PBMs fall within 45 days; the CMS public comment window closes shortly after.",
        ],
        [
          "RECOMMENDED NEXT STEP",
          "Revise all pending payer submissions to reference the updated Part B reimbursement framework within 21 days and prepare CMS comment letter.",
        ],
        [
          "ASSUMPTIONS & SIGNALS",
          "Based on CMS proposed rulemaking, PBM formulary review cycles, and published coverage determination criteria for biologic therapies.",
        ],
      ],
      "Moderate -- anchored in CMS proposed rulemaking and confirmed PBM formulary review cycle deadlines.",
    ),
  },
}

export function getRecommendation(
  cardId: CardId,
  department: LegacyDepartment,
): Recommendation {
  return recommendations[cardId][department]
}
