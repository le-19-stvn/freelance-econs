import { z } from 'zod'

// ── Sheets export (POST /api/invoices/sheets) ──
export const SheetsExportSchema = z.object({
  spreadsheetId: z.string().min(1, 'spreadsheetId requis'),
  accessToken: z.string().min(1, 'accessToken requis'),
  refreshToken: z.string().default(''),
})

// ── PDF generation (POST /api/invoices/pdf) ──
export const PdfGenerateSchema = z.object({
  invoiceId: z.string().uuid('invoiceId doit être un UUID valide'),
})

// ── Generic UUID param validation ──
export const UuidParamSchema = z.object({
  id: z.string().uuid('ID invalide'),
})
