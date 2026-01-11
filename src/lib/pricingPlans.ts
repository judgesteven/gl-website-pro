import { EXTERNAL_EMAILS } from './external';

export interface PricingPlan {
  name: string;
  slug: string;
  price: string;
  period: string;
  users: string;
  features: string[];
  buttonText: string;
  stripeLink: string | null;
  gocardlessLink: string | null;
}

export const pricingPlans: PricingPlan[] = [
  {
    name: "Starter",
    slug: "starter",
    price: "€100",
    period: "month",
    users: "Up to 1,000 users",
    features: [
      "Up to 1,000 users",
      "Email support",
      "Basic analytics"
    ],
    buttonText: "Choose Plan",
    stripeLink: "https://buy.stripe.com/9B6fZig0l9So1iF7S5fw400",
    gocardlessLink: "https://pay.gocardless.com/BRT00043YPKPHZR",
  },
  {
    name: "Growth",
    slug: "growth",
    price: "€1,000",
    period: "month",
    users: "Up to 25,000 users",
    features: [
      "Up to 25,000 users",
      "Priority support",
      "Basic Analytics"
    ],
    buttonText: "Choose Plan",
    stripeLink: "https://buy.stripe.com/cNi00k7tP5C81iF8W9fw401",
    gocardlessLink: "https://pay.gocardless.com/BRT00043YPNWZ8J",
  },
  {
    name: "Scale",
    slug: "scale",
    price: "€2,000",
    period: "month",
    users: "Up to 100,000 users",
    features: [
      "Up to 100,000 users",
      "Advanced support",
      "Advanced reporting"
    ],
    buttonText: "Choose Plan",
    stripeLink: "https://buy.stripe.com/28EaEY29v3u0gdz1tHfw403",
    gocardlessLink: "https://pay.gocardless.com/BRT00043YPQ0HSS",
  },
  {
    name: "Enterprise",
    slug: "enterprise",
    price: "Ask Us",
    period: "",
    users: "Above 100,000 users",
    features: [
      "Unlimited users",
      "Dedicated SLA",
      "Dedicated support",
      "Advanced reporting"
    ],
    buttonText: "Contact Sales",
    stripeLink: null,
    gocardlessLink: null,
  }
];

