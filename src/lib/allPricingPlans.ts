/**
 * All 8 legacy pricing tiers (Build + Scale) for the hidden /pricing page.
 * The main landing page shows only 3 tiers; this list is for reference.
 */

export interface LegacyPricingPlan {
  name: string;
  price: string;
  period: string;
  features: string[];
}

export const allPricingPlans: LegacyPricingPlan[] = [
  {
    name: "Starter",
    price: "€100",
    period: "month",
    features: [
      "Up to 1,000 active users",
      "Technical & Implementation Support: Email",
      "Concept & Programme Design Support: Ask for pricing",
      "Analytics & Reporting: Dashboard"
    ]
  },
  {
    name: "Essentials",
    price: "€500",
    period: "month",
    features: [
      "Up to 10,000 active users",
      "Technical & Implementation Support: Email",
      "Concept & Programme Design Support: Ask for pricing",
      "Analytics & Reporting: Dashboard"
    ]
  },
  {
    name: "Advanced",
    price: "€1,000",
    period: "month",
    features: [
      "Up to 25,000 active users",
      "Technical & Implementation Support: Email",
      "Concept & Programme Design Support: Ask for pricing",
      "Analytics & Reporting: Dashboard"
    ]
  },
  {
    name: "Growth",
    price: "€1,500",
    period: "month",
    features: [
      "Up to 50,000 active users",
      "Technical & Implementation Support: Slack",
      "Concept & Programme Design Support: Ask for pricing",
      "Analytics & Reporting: Weekly reports & monthly insights"
    ]
  },
  {
    name: "Professional",
    price: "€2,000",
    period: "month",
    features: [
      "Up to 100,000 active users",
      "Technical & Implementation Support: Slack",
      "Concept & Programme Design Support: Included (on request)",
      "Analytics & Reporting: Weekly reports & monthly insights"
    ]
  },
  {
    name: "Scale",
    price: "€3,500",
    period: "month",
    features: [
      "Up to 250,000 active users",
      "Technical & Implementation Support: Slack",
      "Concept & Programme Design Support: Included (on request)",
      "Analytics & Reporting: Weekly reports & monthly insights"
    ]
  },
  {
    name: "Scale Plus",
    price: "€6,000",
    period: "month",
    features: [
      "Up to 500,000 active users",
      "Technical & Implementation Support: Customer specific",
      "Concept & Programme Design Support: Included (on request)",
      "Analytics & Reporting: Customer specific"
    ]
  },
  {
    name: "Hyper Scale",
    price: "€10,000",
    period: "month",
    features: [
      "Up to 1,000,000 active users",
      "Technical & Implementation Support: Customer specific",
      "Concept & Programme Design Support: Included (on request)",
      "Analytics & Reporting: Customer specific"
    ]
  }
];
