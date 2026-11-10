/**
 * Grading, Percentage, and Ranking utilities for Academy Manager SaaS.
 * Standardized according to business rules:
 * - 90 and above: A+
 * - 80 to 89.9:   A
 * - 70 to 79.9:   B
 * - 60 to 69.9:   C
 * - 50 to 59.9:   D
 * - Below 50:     F
 * - Subject failed if marks are below passingMarks (or if absent).
 * - Overall failed if ANY subject is failed.
 * - Dense ranking for class positions (ties handled gracefully).
 */

/**
 * Calculates academic grade based on percentage score.
 *
 * @param {number} percentage - Percentage score (0 - 100)
 * @returns {"A+"|"A"|"B"|"C"|"D"|"F"}
 */
export function calculateGrade(percentage) {
  const pct = Number(percentage) || 0;
  if (pct >= 90) return "A+";
  if (pct >= 80) return "A";
  if (pct >= 70) return "B";
  if (pct >= 60) return "C";
  if (pct >= 50) return "D";
  return "F";
}

/**
 * Determines whether a student passed a specific subject.
 *
 * @param {number|null} marksObtained - Score received
 * @param {number} passingMarks - Minimum passing cutoff
 * @param {boolean} isAbsent - Flag whether student was absent
 * @returns {boolean}
 */
export function isSubjectPassed(marksObtained, passingMarks, isAbsent = false) {
  if (isAbsent || marksObtained === null || marksObtained === undefined) {
    return false;
  }
  return Number(marksObtained) >= Number(passingMarks);
}

/**
 * Calculates percentage rounded to 1 decimal place.
 *
 * @param {number} obtained
 * @param {number} total
 * @returns {number} e.g. 85.5
 */
export function calculatePercentage(obtained, total) {
  const t = Number(total) || 0;
  const o = Number(obtained) || 0;
  if (t <= 0) return 0.0;
  const pct = (o / t) * 100;
  return Math.round(pct * 10) / 10;
}

/**
 * Applies dense ranking with ties handled to an array of student results.
 * Dense rank rules:
 * - Sorted by totalObtained DESC (or percentage DESC).
 * - If two students have the exact same total score, they share the same position.
 * - The next distinct score receives the immediate next position integer (e.g. 1, 2, 2, 3, 4, 4, 5).
 *
 * @param {Array<object>} studentResults - Array of student result records
 * @returns {Array<object>} Same array with student.position set
 */
export function applyDenseRanking(studentResults) {
  if (!Array.isArray(studentResults) || studentResults.length === 0) {
    return [];
  }

  // Sort descending by totalObtained, tie-breaker rollNo ascending
  studentResults.sort((a, b) => {
    if (b.totalObtained !== a.totalObtained) {
      return b.totalObtained - a.totalObtained;
    }
    return String(a.rollNo || "").localeCompare(String(b.rollNo || ""));
  });

  let currentRank = 1;
  for (let i = 0; i < studentResults.length; i++) {
    if (i > 0) {
      const prev = studentResults[i - 1];
      const curr = studentResults[i];
      // Increment rank only if totalObtained is different
      if (curr.totalObtained !== prev.totalObtained) {
        currentRank++;
      }
    }
    studentResults[i].position = currentRank;
  }

  return studentResults;
}

export default {
  calculateGrade,
  isSubjectPassed,
  calculatePercentage,
  applyDenseRanking,
};
