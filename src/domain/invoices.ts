import type { AppData, Category, Invoice } from './types'
import { addDays, formatDayMonth } from './dates'

/** Default pay-by period for a new invoice, in days after the purchase. */
export const DEFAULT_DUE_DAYS = 14

/** How many days before "Zahlen bis" the reminder shows up. */
export const REMINDER_DAYS = 3

/** Default "Zahlen bis" for a purchase date. */
export function defaultDueDate(purchaseDate: string): string {
  return addDays(purchaseDate, DEFAULT_DUE_DAYS)
}

/** The day the user is asked whether the amount stayed the same: three days before "Zahlen bis". */
export function invoiceReminderDate(inv: Pick<Invoice, 'dueDate'>): string {
  return addDays(inv.dueDate, -REMINDER_DAYS)
}

/** Past the pay-by date. */
export function isOverdue(inv: Pick<Invoice, 'dueDate'>, today: string): boolean {
  return today > inv.dueDate
}

/** Open invoices sorted by pay-by date, then merchant (empty notes last among equals' names are compared as ''). */
export function sortInvoices(invoices: Invoice[]): Invoice[] {
  return [...invoices].sort(
    (a, b) =>
      a.dueDate.localeCompare(b.dueDate) ||
      (a.note ?? '').localeCompare(b.note ?? '', 'de') ||
      a.createdAt - b.createdAt,
  )
}

/** Invoices that ask for attention today: reminder date reached and not snoozed any more. */
export function dueInvoices(data: AppData, today: string): Invoice[] {
  return sortInvoices(
    data.invoices.filter((inv) => today >= invoiceReminderDate(inv) && (!inv.snoozedUntil || today >= inv.snoozedUntil)),
  )
}

/** Sum of all open invoices in cents. */
export function openInvoicesTotal(data: AppData): number {
  return data.invoices.reduce((sum, inv) => sum + inv.amountCents, 0)
}

/** "Später": hide the reminder for two days, but not past the pay-by date; on or after it, one day. */
export function snoozeDate(inv: Pick<Invoice, 'dueDate'>, today: string): string {
  if (today >= inv.dueDate) return addDays(today, 1)
  const two = addDays(today, 2)
  return two < inv.dueDate ? two : inv.dueDate
}

/** Merchant, or the category name when there is none. */
export function invoiceTitle(inv: Pick<Invoice, 'note' | 'categoryId'>, categories: Category[]): string {
  return inv.note || categories.find((c) => c.id === inv.categoryId)?.name || 'Rechnung'
}

/** "zahlen bis 03.11." or, after that day, "überfällig seit 03.11.". */
export function dueText(inv: Pick<Invoice, 'dueDate'>, today: string): string {
  return isOverdue(inv, today) ? `überfällig seit ${formatDayMonth(inv.dueDate)}` : `zahlen bis ${formatDayMonth(inv.dueDate)}`
}
