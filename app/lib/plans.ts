export type PlanId = "free" | "pro" | "studio" | "intelligence";

export type Plan = {
  id: PlanId;
  name: string;
  price: string;
  description: string;
  aiDaily: number;
  aiMonthly: number;
  features: string[];
  selfServe: boolean;
};

export const PLANS: Record<PlanId, Plan> = {
  free: {
    id: "free",
    name: "Free",
    price: "$0",
    description: "Create, share and collect responses without a paywall.",
    aiDaily: 10,
    aiMonthly: 100,
    features: ["Unlimited manual polls", "Unlimited organic responses", "100 AI-assisted polls each month", "Basic results and immutable records"],
    selfServe: true,
  },
  pro: {
    id: "pro",
    name: "Creator Pro",
    price: "$19 / month",
    description: "For creators who publish and analyze polls regularly.",
    aiDaily: 50,
    aiMonthly: 300,
    features: ["300 AI-assisted polls each month", "AI result reports and share copy", "Neutrality review and rewrites", "Tracked link exports and verified records"],
    selfServe: true,
  },
  studio: {
    id: "studio",
    name: "Creator Studio",
    price: "$79 / month",
    description: "For teams running a serious publishing program.",
    aiDaily: 200,
    aiMonthly: 2000,
    features: ["2,000 AI-assisted polls each month", "Everything in Creator Pro", "High-volume creator publishing", "Priority product onboarding"],
    selfServe: true,
  },
  intelligence: {
    id: "intelligence",
    name: "Intelligence",
    price: "From $1,000 / month",
    description: "Verified aggregate opinion intelligence for organizations.",
    aiDaily: -1,
    aiMonthly: -1,
    features: ["Cross-creator aggregate intelligence", "Longitudinal opinion trends", "Methodology and provenance records", "Custom research and data delivery"],
    selfServe: false,
  },
};

export function planFor(value: unknown): Plan {
  const id = String(value || "free") as PlanId;
  return PLANS[id] || PLANS.free;
}
