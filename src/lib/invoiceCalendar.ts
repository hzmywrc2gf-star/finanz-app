import type { Invoice } from '../domain/types'
import { formatDateDE } from '../domain/dates'
import { invoiceReminderDate } from '../domain/invoices'
import { formatCents } from '../domain/money'
import { downloadFile } from './download'
import { buildIcs } from './ics'

/** The calendar file for an invoice: a reminder at 09:00, three days before "Zahlen bis". */
export function invoiceIcs(inv: Invoice, title: string, now?: Date): string {
  return buildIcs({
    uid: inv.id,
    date: invoiceReminderDate(inv),
    summary: `Rechnung prüfen: ${title} ${formatCents(inv.amountCents)}`.replace(/ /g, ' '),
    description: `Zahlen bis ${formatDateDE(inv.dueDate)} · in Finanzklar bestätigen`,
    now,
  })
}

export function invoiceIcsFileName(inv: Invoice): string {
  return `rechnung-${invoiceReminderDate(inv)}.ics`
}

/** Hands the reminder to the browser; on iOS Safari this opens "Zum Kalender hinzufügen". */
export function downloadInvoiceReminder(inv: Invoice, title: string): void {
  downloadFile(invoiceIcsFileName(inv), invoiceIcs(inv, title), 'text/calendar;charset=utf-8')
}
