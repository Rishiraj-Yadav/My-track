import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import {
  type Expense,
  type Goal,
  type Profile,
  type SipPlan,
  monthlyEquivalent,
  formatINR,
  calculateMonthlyTotals,
  healthScore,
  groupExpensesByCategory,
} from './finance'

// ─── CSV Export ───────────────────────────────────────────────────
export const exportCSV = (expenses: Expense[], goals: Goal[], profile: Profile) => {
  const lines: string[] = []

  // Profile
  lines.push('PROFILE')
  lines.push('Name,Salary,Savings')
  lines.push(`${profile.name},${profile.monthlySalary},${profile.savings}`)
  lines.push('')

  // Expenses
  lines.push('EXPENSES')
  lines.push('Name,Amount,Frequency,Tag,Monthly Equivalent')
  for (const e of expenses) {
    if (!e.archived) {
      lines.push(`"${e.name}",${e.amount},${e.frequency},${e.tag},${Math.round(monthlyEquivalent(e.amount, e.frequency))}`)
    }
  }
  lines.push('')

  // Goals
  lines.push('GOALS')
  lines.push('Name,Target Amount,Saved Amount,Target Date,Priority,Progress %')
  for (const g of goals) {
    const pct = g.targetAmount > 0 ? Math.round((g.savedAmount / g.targetAmount) * 100) : 0
    lines.push(`"${g.name}",${g.targetAmount},${g.savedAmount},${g.targetDate},${g.priority},${pct}`)
  }

  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  const date = new Date().toISOString().slice(0, 10)
  a.download = `mytrack-report-${date}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

// ─── PDF Export ───────────────────────────────────────────────────
export const exportPDF = (
  expenses: Expense[],
  goals: Goal[],
  profile: Profile,
  sip: SipPlan,
) => {
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()
  const date = new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })

  // Colors
  const dark = [18, 18, 18] as [number, number, number]
  const green = [78, 222, 163] as [number, number, number]
  const gray = [120, 120, 120] as [number, number, number]
  const white = [255, 255, 255] as [number, number, number]

  // ── Header ──
  doc.setFillColor(...dark)
  doc.rect(0, 0, pageWidth, 45, 'F')
  doc.setTextColor(...green)
  doc.setFontSize(24)
  doc.setFont('helvetica', 'bold')
  doc.text('MyTrack', 20, 22)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...white)
  doc.text('Financial Report', 20, 32)
  doc.setTextColor(...gray)
  doc.text(date, pageWidth - 20, 32, { align: 'right' })

  // ── Profile Summary ──
  let y = 58
  doc.setTextColor(...dark)
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('Profile Summary', 20, y)
  y += 10

  const totals = calculateMonthlyTotals(expenses)
  const score = healthScore({
    salary: profile.monthlySalary,
    leakage: totals.leakage,
    sipAmount: sip.monthlyAmount,
    goalsOnTrack: goals.some(g => g.savedAmount >= g.targetAmount * 0.35),
    streak: 12,
    subscriptions: expenses.filter(e => e.name.toLowerCase().includes('ott')).length,
  })

  const profileData = [
    ['Name', profile.name],
    ['Monthly Salary', formatINR(profile.monthlySalary)],
    ['Total Savings', formatINR(profile.savings)],
    ['Monthly SIP', formatINR(sip.monthlyAmount)],
    ['Health Score', `${score}/100`],
    ['Monthly Spending', formatINR(totals.total)],
    ['Savings Rate', `${profile.monthlySalary > 0 ? Math.round(((profile.monthlySalary - totals.total) / profile.monthlySalary) * 100) : 0}%`],
  ]

  autoTable(doc, {
    startY: y,
    head: [['Metric', 'Value']],
    body: profileData,
    theme: 'grid',
    headStyles: { fillColor: green, textColor: dark, fontStyle: 'bold' },
    styles: { fontSize: 10, cellPadding: 4 },
    margin: { left: 20, right: 20 },
  })

  // ── Expenses Table ──
  y = (doc as any).lastAutoTable.finalY + 15
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('Expense Breakdown', 20, y)
  y += 8

  const expenseData = expenses
    .filter(e => !e.archived)
    .map(e => [
      e.name,
      formatINR(e.amount),
      e.frequency,
      e.tag.charAt(0).toUpperCase() + e.tag.slice(1),
      formatINR(Math.round(monthlyEquivalent(e.amount, e.frequency))),
    ])

  autoTable(doc, {
    startY: y,
    head: [['Expense', 'Amount', 'Frequency', 'Tag', 'Monthly']],
    body: expenseData,
    theme: 'striped',
    headStyles: { fillColor: green, textColor: dark, fontStyle: 'bold' },
    styles: { fontSize: 9, cellPadding: 3 },
    margin: { left: 20, right: 20 },
    columnStyles: {
      1: { halign: 'right' },
      4: { halign: 'right', fontStyle: 'bold' },
    },
  })

  // ── Category Summary ──
  doc.addPage()
  y = 25
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('Category Allocation', 20, y)
  y += 8

  const cats = groupExpensesByCategory(expenses)
  const catData = cats.map(c => [c.category, formatINR(c.amount), `${c.percentage}%`])
  catData.push(['TOTAL', formatINR(totals.total), '100%'])

  autoTable(doc, {
    startY: y,
    head: [['Category', 'Monthly Amount', 'Share']],
    body: catData,
    theme: 'grid',
    headStyles: { fillColor: green, textColor: dark, fontStyle: 'bold' },
    styles: { fontSize: 10, cellPadding: 4 },
    margin: { left: 20, right: 20 },
    columnStyles: {
      1: { halign: 'right' },
      2: { halign: 'right' },
    },
  })

  // ── Goals Table ──
  y = (doc as any).lastAutoTable.finalY + 15
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('Financial Goals', 20, y)
  y += 8

  const goalData = goals.map(g => [
    g.name,
    formatINR(g.targetAmount),
    formatINR(g.savedAmount),
    g.targetDate,
    `${g.targetAmount > 0 ? Math.round((g.savedAmount / g.targetAmount) * 100) : 0}%`,
  ])

  autoTable(doc, {
    startY: y,
    head: [['Goal', 'Target', 'Saved', 'Deadline', 'Progress']],
    body: goalData,
    theme: 'striped',
    headStyles: { fillColor: green, textColor: dark, fontStyle: 'bold' },
    styles: { fontSize: 9, cellPadding: 3 },
    margin: { left: 20, right: 20 },
    columnStyles: {
      1: { halign: 'right' },
      2: { halign: 'right' },
      4: { halign: 'center', fontStyle: 'bold' },
    },
  })

  // ── Footer ──
  const totalPages = doc.getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setTextColor(...gray)
    doc.text(
      `Generated by MyTrack · Page ${i} of ${totalPages}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' },
    )
  }

  doc.save(`mytrack-report-${new Date().toISOString().slice(0, 10)}.pdf`)
}
