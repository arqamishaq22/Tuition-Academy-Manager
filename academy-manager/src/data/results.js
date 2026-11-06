// Mock data for exams, assessment marks, grade distribution, and report cards

export const initialExams = [
  {
    id: "ex-001",
    name: "October Monthly Assessment",
    className: "Class 10 - Mathematics & Physics",
    subject: "Physics",
    date: "2026-10-25",
    totalMarks: 50,
    passingMarks: 20,
    status: "Published",
  },
  {
    id: "ex-002",
    name: "Mid-Term Examination 2026",
    className: "Class 10 - Mathematics & Physics",
    subject: "Mathematics",
    date: "2026-11-02",
    totalMarks: 100,
    passingMarks: 40,
    status: "Published",
  },
  {
    id: "ex-003",
    name: "Biology Chapter 1-3 Quiz",
    className: "FSc Pre-Medical - Biology & Chemistry",
    subject: "Biology",
    date: "2026-10-28",
    totalMarks: 50,
    passingMarks: 20,
    status: "Published",
  },
  {
    id: "ex-004",
    name: "Calculus & Mechanics Evaluation",
    className: "FSc Pre-Engineering - Math & Physics",
    subject: "Mathematics",
    date: "2026-11-04",
    totalMarks: 100,
    passingMarks: 40,
    status: "Marks pending",
  },
  {
    id: "ex-005",
    name: "General Science Assessment 1",
    className: "Class 9 - Science Group",
    subject: "General Science",
    date: "2026-11-14",
    totalMarks: 50,
    passingMarks: 20,
    status: "Upcoming",
  },
  {
    id: "ex-006",
    name: "C++ & Database Logic Evaluation",
    className: "ICS - Computer Science & Math",
    subject: "Computer Science",
    date: "2026-11-18",
    totalMarks: 75,
    passingMarks: 30,
    status: "Upcoming",
  },
];

// Stored student marks by exam ID: { [examId]: { [studentId]: number } }
export const initialMarksByExam = {
  // Class 10 - Physics (Total 50)
  "ex-001": {
    "std-001": 46, // Muhammad Ali (92% - A+)
    "std-006": 48, // Zainab Bibi (96% - A+) -> 1st
    "std-011": 32, // Abdullah Shah (64% - C)
    "std-016": 44, // Iqra Naeem (88% - A) -> 3rd
    "std-021": 41, // Mustafa Kamal (82% - A)
    "std-026": 45, // Mehwish Riaz (90% - A+) -> 2nd
    "std-031": 38, // Nabeel Munir (76% - B)
  },

  // Class 10 - Mathematics Mid-Term (Total 100)
  "ex-002": {
    "std-001": 94, // Muhammad Ali (94% - A+) -> 2nd
    "std-006": 97, // Zainab Bibi (97% - A+) -> 1st
    "std-011": 58, // Abdullah Shah (58% - D)
    "std-016": 91, // Iqra Naeem (91% - A+) -> 3rd
    "std-021": 84, // Mustafa Kamal (84% - A)
    "std-026": 89, // Mehwish Riaz (89% - A)
    "std-031": 73, // Nabeel Munir (73% - B)
  },

  // FSc Pre-Medical - Biology (Total 50)
  "ex-003": {
    "std-002": 48, // Fatima Noor (96% - A+) -> 1st
    "std-008": 46, // Mariam Khan (92% - A+) -> 2nd
    "std-012": 45, // Khadija Rehman (90% - A+) -> 3rd
    "std-018": 44, // Mahnoor Tariq (88% - A)
    "std-023": 41, // Waleed Asif (82% - A)
    "std-028": 39, // Areeba Batool (78% - B)
  },

  // FSc Pre-Engineering - Calculus (Marks pending: partial marks entered)
  "ex-004": {
    "std-004": 92, // Ayesha Siddiqua
    "std-009": 76, // Saad Rafiq
    "std-014": 84, // Sana Mir
    // std-019, std-024, std-029 pending
  },
};

// Historical progress trends for Report Cards Line Chart
export const studentHistoricalProgress = {
  "std-001": [
    { exam: "Diagnostic", percentage: 82 },
    { exam: "Aug Quiz", percentage: 86 },
    { exam: "Sep Test", percentage: 90 },
    { exam: "Oct Assessment", percentage: 92 },
    { exam: "Mid-Term", percentage: 94 },
  ],
  "std-002": [
    { exam: "Diagnostic", percentage: 88 },
    { exam: "Aug Quiz", percentage: 91 },
    { exam: "Sep Test", percentage: 94 },
    { exam: "Oct Assessment", percentage: 96 },
    { exam: "Mid-Term", percentage: 95 },
  ],
  "std-003": [
    { exam: "Diagnostic", percentage: 65 },
    { exam: "Aug Quiz", percentage: 68 },
    { exam: "Sep Test", percentage: 72 },
    { exam: "Oct Assessment", percentage: 74 },
    { exam: "Mid-Term", percentage: 70 },
  ],
  "std-004": [
    { exam: "Diagnostic", percentage: 85 },
    { exam: "Aug Quiz", percentage: 89 },
    { exam: "Sep Test", percentage: 92 },
    { exam: "Oct Assessment", percentage: 94 },
    { exam: "Mid-Term", percentage: 92 },
  ],
  default: [
    { exam: "Diagnostic", percentage: 75 },
    { exam: "Aug Quiz", percentage: 78 },
    { exam: "Sep Test", percentage: 82 },
    { exam: "Oct Assessment", percentage: 85 },
    { exam: "Mid-Term", percentage: 88 },
  ],
};

// Default subjects for report cards by class
export const classReportSubjects = {
  "Class 10 - Mathematics & Physics": [
    { subject: "Physics", total: 100, obtained: 92 },
    { subject: "Mathematics", total: 100, obtained: 94 },
    { subject: "Chemistry", total: 100, obtained: 88 },
    { subject: "English Language", total: 75, obtained: 67 },
    { subject: "Urdu", total: 75, obtained: 65 },
    { subject: "Islamiyat", total: 50, obtained: 46 },
  ],
  "FSc Pre-Medical - Biology & Chemistry": [
    { subject: "Biology", total: 100, obtained: 96 },
    { subject: "Chemistry", total: 100, obtained: 90 },
    { subject: "Physics", total: 100, obtained: 89 },
    { subject: "English", total: 100, obtained: 84 },
    { subject: "Urdu / Pak Studies", total: 100, obtained: 88 },
  ],
  "FSc Pre-Engineering - Math & Physics": [
    { subject: "Mathematics", total: 100, obtained: 92 },
    { subject: "Physics", total: 100, obtained: 88 },
    { subject: "Chemistry", total: 100, obtained: 85 },
    { subject: "English", total: 100, obtained: 80 },
    { subject: "Urdu / Pak Studies", total: 100, obtained: 86 },
  ],
  "Class 9 - Science Group": [
    { subject: "General Science", total: 100, obtained: 82 },
    { subject: "Mathematics", total: 100, obtained: 78 },
    { subject: "Chemistry", total: 100, obtained: 76 },
    { subject: "English", total: 75, obtained: 64 },
    { subject: "Urdu", total: 75, obtained: 62 },
  ],
  "ICS - Computer Science & Math": [
    { subject: "Computer Science", total: 100, obtained: 90 },
    { subject: "Mathematics", total: 100, obtained: 84 },
    { subject: "Statistics / Physics", total: 100, obtained: 81 },
    { subject: "English", total: 100, obtained: 83 },
    { subject: "Urdu / Pak Studies", total: 100, obtained: 85 },
  ],
};
