import { Users, CalendarCheck, CreditCard, Award, BellRing, Smartphone } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";

// Features highlight section
export function Features() {
  const featureList = [
    {
      icon: Users,
      title: "Student Admissions",
      description:
        "Manage roll numbers, class batches (Matric, FSc, ICS, O/A Levels), and parent contact details easily.",
    },
    {
      icon: CalendarCheck,
      title: "Daily Attendance",
      description:
        "One-click daily attendance marking with automated absence logs and monthly attendance percentage.",
    },
    {
      icon: CreditCard,
      title: "PKR Fee Management",
      description:
        "Generate fee vouchers, track paid/pending/overdue dues, and record JazzCash, EasyPaisa or cash payments.",
    },
    {
      icon: Award,
      title: "Assessments & Results",
      description:
        "Record marks for weekly tests and term exams. Auto-calculate grades, percentages, and positions.",
    },
    {
      icon: BellRing,
      title: "Parent Notifications",
      description:
        "Notify parents instantly about absent status, pending fee reminders, and test marks.",
    },
    {
      icon: Smartphone,
      title: "Mobile Friendly",
      description:
        "Works smoothly on smartphones, tablets, and desktops so teachers can mark attendance on the go.",
    },
  ];

  return (
    <section className="py-20 bg-slate-50 dark:bg-slate-900/50">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Everything your tuition center needs
          </h2>
          <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
            Replace messy paper registers, Excel sheets, and lost receipts with a simple digital platform.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {featureList.map((feat, index) => {
            const Icon = feat.icon;
            return (
              <Card key={index} className="transition-all hover:shadow-md">
                <CardHeader>
                  <div className="h-10 w-10 rounded-lg bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center text-emerald-700 dark:text-emerald-400 mb-2">
                    <Icon className="h-5 w-5" />
                  </div>
                  <CardTitle className="text-base">{feat.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    {feat.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default Features;

