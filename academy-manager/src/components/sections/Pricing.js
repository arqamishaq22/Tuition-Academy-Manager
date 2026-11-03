import Link from "next/link";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/Card";

// Affordable pricing tiers tailored for Pakistani coaching centers
export function Pricing() {
  const plans = [
    {
      name: "Starter",
      price: "Rs. 2,500",
      period: "/ month",
      description: "Ideal for home tutors and small coaching groups",
      features: [
        "Up to 50 active students",
        "Attendance tracking",
        "Basic fee voucher generation",
        "Single branch / tutor",
      ],
      cta: "Get Started",
      popular: false,
    },
    {
      name: "Academy Pro",
      price: "Rs. 5,999",
      period: "/ month",
      description: "Best for established tuition academies with multiple batches",
      features: [
        "Up to 300 active students",
        "Complete fee tracking (JazzCash/EasyPaisa)",
        "Exam results & report cards",
        "Parent portal access",
        "Up to 5 staff/teacher accounts",
      ],
      cta: "Start 14-Day Free Trial",
      popular: true,
    },
    {
      name: "Institute",
      price: "Rs. 12,000",
      period: "/ month",
      description: "For large colleges and multi-branch academies",
      features: [
        "Unlimited students",
        "Multiple branches support",
        "Custom SMS gateway integration",
        "Dedicated account manager",
        "Priority WhatsApp support",
      ],
      cta: "Contact Sales",
      popular: false,
    },
  ];

  return (
    <section className="py-20 bg-white dark:bg-slate-900">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Transparent Pricing in PKR
          </h2>
          <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
            Affordable plans designed for Pakistani education budgets with local payment methods.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan, index) => (
            <Card
              key={index}
              className={`relative flex flex-col justify-between ${
                plan.popular
                  ? "border-emerald-600 ring-2 ring-emerald-600 dark:border-emerald-500"
                  : ""
              }`}
            >
              <div>
                {plan.popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-600 text-white text-[10px] font-bold uppercase tracking-wider px-3 py-0.5 rounded-full">
                    Most Popular
                  </span>
                )}
                <CardHeader>
                  <CardTitle className="text-lg">{plan.name}</CardTitle>
                  <p className="text-xs text-slate-500">{plan.description}</p>
                  <div className="mt-4">
                    <span className="text-3xl font-extrabold text-slate-900 dark:text-white">
                      {plan.price}
                    </span>
                    <span className="text-xs text-slate-500">{plan.period}</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2.5 text-xs text-slate-600 dark:text-slate-300">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </div>

              <CardFooter>
                <Link href="/signup" className="w-full">
                  <Button
                    variant={plan.popular ? "primary" : "outline"}
                    className="w-full"
                  >
                    {plan.cta}
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Pricing;

