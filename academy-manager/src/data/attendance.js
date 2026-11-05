// Mock data and generators for student attendance records, daily statuses, and monthly history

export const STATUS_TYPES = {
  PRESENT: "Present",
  ABSENT: "Absent",
  LATE: "Late",
  LEAVE: "Leave",
};

// Initial default statuses for today (2026-11-05) across all 32 students
export const initialAttendanceRecords = {
  "2026-11-05": {
    // Class 10 - Mathematics & Physics
    "std-001": "Present",
    "std-006": "Present",
    "std-011": "Absent", // Abdullah Shah (low attendance)
    "std-016": "Present",
    "std-021": "Late",
    "std-026": "Present",
    "std-031": "Present",

    // FSc Pre-Medical - Biology & Chemistry
    "std-002": "Absent", // Fatima Noor
    "std-007": "Present",
    "std-012": "Present",
    "std-017": "Present",
    "std-022": "Leave",
    "std-027": "Present",

    // Class 9 - Science Group
    "std-003": "Present",
    "std-008": "Present",
    "std-013": "Absent", // Omer Farooq
    "std-018": "Present",
    "std-023": "Present",
    "std-028": "Late",
    "std-032": "Present",

    // FSc Pre-Engineering - Math & Physics
    "std-004": "Present",
    "std-009": "Present",
    "std-014": "Present",
    "std-019": "Absent",
    "std-024": "Present",
    "std-029": "Late",

    // ICS - Computer Science & Math
    "std-005": "Leave",
    "std-010": "Present",
    "std-015": "Present",
    "std-020": "Present",
    "std-025": "Absent", // Shahzaib Lodhi
    "std-030": "Present",
  },
};

// November 2026 calendar days data (30 days)
// Nov 1 was Sunday (day 0), Nov 5 is Thursday (today)
const NOVEMBER_DAYS_CONFIG = [
  { day: 1, isWeekend: true, rate: null },
  { day: 2, isWeekend: false, rate: 98, best: true }, // Monday - Best day
  { day: 3, isWeekend: false, rate: 92 },
  { day: 4, isWeekend: false, rate: 71, lowest: true }, // Wednesday - Lowest day
  { day: 5, isWeekend: false, rate: 94 }, // Today
  { day: 6, isWeekend: false, rate: 91, isFuture: true },
  { day: 7, isWeekend: false, rate: 95, isFuture: true },
  { day: 8, isWeekend: true, rate: null },
  { day: 9, isWeekend: false, rate: 93, isFuture: true },
  { day: 10, isWeekend: false, rate: 96, isFuture: true },
  { day: 11, isWeekend: false, rate: 92, isFuture: true },
  { day: 12, isWeekend: false, rate: 94, isFuture: true },
  { day: 13, isWeekend: false, rate: 89, isFuture: true },
  { day: 14, isWeekend: false, rate: 90, isFuture: true },
  { day: 15, isWeekend: true, rate: null },
  { day: 16, isWeekend: false, rate: 93, isFuture: true },
  { day: 17, isWeekend: false, rate: 95, isFuture: true },
  { day: 18, isWeekend: false, rate: 88, isFuture: true },
  { day: 19, isWeekend: false, rate: 92, isFuture: true },
  { day: 20, isWeekend: false, rate: 94, isFuture: true },
  { day: 21, isWeekend: false, rate: 96, isFuture: true },
  { day: 22, isWeekend: true, rate: null },
  { day: 23, isWeekend: false, rate: 93, isFuture: true },
  { day: 24, isWeekend: false, rate: 91, isFuture: true },
  { day: 25, isWeekend: false, rate: 95, isFuture: true },
  { day: 26, isWeekend: false, rate: 92, isFuture: true },
  { day: 27, isWeekend: false, rate: 94, isFuture: true },
  { day: 28, isWeekend: false, rate: 97, isFuture: true },
  { day: 29, isWeekend: true, rate: null },
  { day: 30, isWeekend: false, rate: 93, isFuture: true },
];

/**
 * Returns month calendar heatmap data for a given class
 */
export function getMonthHeatmap(className, studentsInClass = []) {
  const total = studentsInClass.length || 7;

  const days = NOVEMBER_DAYS_CONFIG.map((cfg) => {
    const dayStr = String(cfg.day).padStart(2, "0");
    const date = `2026-11-${dayStr}`;

    // Day of week for Nov 2026: Nov 1 = Sunday, Nov 2 = Monday, etc.
    const dayOfWeek = (cfg.day % 7 === 1) ? 0 : (cfg.day % 7 === 2) ? 1 : (cfg.day % 7 === 3) ? 2 : (cfg.day % 7 === 4) ? 3 : (cfg.day % 7 === 5) ? 4 : (cfg.day % 7 === 6) ? 5 : 6;

    if (cfg.isWeekend) {
      return {
        date,
        day: cfg.day,
        dayOfWeek,
        isWeekend: true,
        isFuture: false,
        percentage: 0,
        presentCount: 0,
        absentCount: 0,
        lateCount: 0,
        leaveCount: 0,
        total,
        studentRecords: [],
      };
    }

    const percentage = cfg.rate || 90;
    const presentCount = Math.max(1, Math.round((percentage / 100) * total));
    const absentCount = total - presentCount;
    const lateCount = cfg.day % 3 === 0 ? 1 : 0;
    const leaveCount = cfg.day === 5 ? 1 : 0;

    // Generate mock student roster for that day
    const studentRecords = studentsInClass.map((std, idx) => {
      let status = "Present";
      if (idx === 0 && absentCount > 0) status = "Absent";
      else if (idx === 1 && lateCount > 0) status = "Late";
      else if (idx === 2 && leaveCount > 0) status = "Leave";

      return {
        studentId: std.id,
        name: std.name,
        rollNumber: std.rollNumber,
        phone: std.phone,
        status,
        timeIn: status === "Present" ? "03:55 PM" : status === "Late" ? "04:20 PM" : "-",
      };
    });

    return {
      date,
      day: cfg.day,
      dayOfWeek,
      isWeekend: false,
      isFuture: !!cfg.isFuture,
      percentage,
      presentCount,
      absentCount,
      lateCount,
      leaveCount,
      total,
      studentRecords,
    };
  });

  return {
    month: "November 2026",
    days,
    summary: {
      averageRate: 92.6,
      bestDay: { date: "Nov 02", percentage: 98, note: "Peak attendance (98%)" },
      lowestDay: { date: "Nov 04", percentage: 71, note: "Rain disruption (71%)" },
    },
  };
}
