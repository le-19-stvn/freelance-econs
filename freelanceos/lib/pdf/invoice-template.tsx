import React from 'react'
import path from 'path'
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer'
import type { Invoice, Profile } from '@/types'
import { calculateHT, calculateTVA, calculateTTC } from '@/lib/utils/calculations'

/* ──────────────────────────────────────────────────────────
   Premium Light Swiss Design Invoice — B&W Strict Grid
   Helvetica · No vertical borders · Chrome-level precision
   ────────────────────────────────────────────────────────── */

const LOGO_PATH = path.join(process.cwd(), 'public', 'assets', 'logo-noir-fr.png')

const c = {
  black: '#000000',
  dark: '#1A1A1A',
  mid: '#444444',
  grey: '#777777',
  lightGrey: '#AAAAAA',
  rule: '#D0D0D0',
  faintRule: '#E8E8E8',
  white: '#FFFFFF',
}

const styles = StyleSheet.create({

  /* ════════════════════════════════════════
     PAGE
     ════════════════════════════════════════ */
  page: {
    paddingTop: 48,
    paddingBottom: 110,
    paddingHorizontal: 52,
    fontSize: 9,
    fontFamily: 'Helvetica',
    color: c.dark,
    backgroundColor: c.white,
  },

  /* ════════════════════════════════════════
     HEADER — Top Section
     ════════════════════════════════════════ */
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 36,
  },

  /* -- Left column: FACTURE + logo + sender -- */
  headerLeft: {
    maxWidth: '50%',
  },
  factureTitle: {
    fontSize: 32,
    fontFamily: 'Helvetica-Bold',
    color: c.black,
    letterSpacing: 8,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  logo: {
    width: 100,
    height: 40,
    objectFit: 'contain',
    marginBottom: 14,
  },
  senderName: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: c.dark,
    marginBottom: 2,
  },
  senderLine: {
    fontSize: 8,
    color: c.grey,
    lineHeight: 1.65,
  },

  /* -- Right column: Metadata grid -- */
  headerRight: {
    width: 200,
  },
  metaRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  metaLabel: {
    width: 80,
    fontSize: 7.5,
    fontFamily: 'Helvetica',
    color: c.lightGrey,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  metaValue: {
    flex: 1,
    fontSize: 8.5,
    fontFamily: 'Helvetica-Bold',
    color: c.dark,
    textAlign: 'right',
  },

  /* ════════════════════════════════════════
     SEPARATOR
     ════════════════════════════════════════ */
  separator: {
    borderBottomWidth: 1,
    borderBottomColor: c.faintRule,
    marginBottom: 28,
  },

  /* ════════════════════════════════════════
     CLIENT BLOCK — "Facturer a"
     ════════════════════════════════════════ */
  clientSection: {
    marginBottom: 32,
  },
  sectionLabel: {
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    color: c.lightGrey,
    textTransform: 'uppercase',
    letterSpacing: 2.5,
    marginBottom: 6,
  },
  clientName: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    color: c.black,
    marginBottom: 3,
  },
  clientLine: {
    fontSize: 8.5,
    color: c.mid,
    lineHeight: 1.6,
  },

  /* ════════════════════════════════════════
     ITEMS TABLE — No vertical borders
     ════════════════════════════════════════ */
  table: {
    marginBottom: 4,
  },

  /* -- Header row -- */
  tableHeader: {
    flexDirection: 'row',
    paddingBottom: 8,
    borderBottomWidth: 1.5,
    borderBottomColor: c.black,
  },
  thText: {
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    color: c.grey,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },

  /* -- Body row -- */
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: c.faintRule,
  },
  tdText: {
    fontSize: 9,
    fontFamily: 'Helvetica',
    color: c.dark,
  },
  tdBold: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: c.dark,
  },

  /* -- Column widths -- */
  colDesc:  { flex: 5, paddingRight: 12 },
  colQty:   { width: 50, textAlign: 'right' },
  colPU:    { width: 80, textAlign: 'right' },
  colTotal: { width: 90, textAlign: 'right' },

  /* ════════════════════════════════════════
     TOTALS BLOCK — Right-aligned
     ════════════════════════════════════════ */
  totalsWrapper: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 16,
    marginBottom: 28,
  },
  totalsBox: {
    width: 220,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 7,
    borderBottomWidth: 0.5,
    borderBottomColor: c.faintRule,
  },
  totalLabel: {
    fontSize: 9,
    fontFamily: 'Helvetica',
    color: c.grey,
  },
  totalValue: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: c.dark,
  },
  ttcRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 4,
    borderTopWidth: 2,
    borderTopColor: c.black,
    marginTop: 2,
  },
  ttcLabel: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    color: c.black,
  },
  ttcValue: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    color: c.black,
  },
  ttcUnderline: {
    borderBottomWidth: 1,
    borderBottomColor: c.black,
    marginTop: 4,
  },

  /* ════════════════════════════════════════
     NOTES
     ════════════════════════════════════════ */
  notesBox: {
    marginBottom: 20,
    paddingLeft: 12,
    borderLeftWidth: 2,
    borderLeftColor: c.faintRule,
  },
  notesTitle: {
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    color: c.lightGrey,
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: 5,
  },
  notesText: {
    fontSize: 8.5,
    color: c.mid,
    lineHeight: 1.65,
  },

  /* ════════════════════════════════════════
     PAYMENT DETAILS — Bottom Left
     ════════════════════════════════════════ */
  paymentBox: {
    marginTop: 4,
    paddingTop: 16,
    borderTopWidth: 0.5,
    borderTopColor: c.faintRule,
    maxWidth: 320,
  },
  paymentTitle: {
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    color: c.dark,
    textTransform: 'uppercase',
    letterSpacing: 2.5,
    marginBottom: 10,
  },
  paymentRow: {
    flexDirection: 'row',
    marginBottom: 5,
    alignItems: 'flex-start',
  },
  paymentLabel: {
    width: 110,
    fontSize: 7.5,
    fontFamily: 'Helvetica-Bold',
    color: c.grey,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  paymentValue: {
    flex: 1,
    fontSize: 8.5,
    fontFamily: 'Courier',
    color: c.dark,
    letterSpacing: 0.5,
  },
  paymentLink: {
    flex: 1,
    fontSize: 8.5,
    fontFamily: 'Helvetica',
    color: c.dark,
    textDecoration: 'underline',
  },

  /* ════════════════════════════════════════
     LEGAL — TVA exemption
     ════════════════════════════════════════ */
  legalText: {
    fontSize: 7.5,
    fontFamily: 'Helvetica-Oblique',
    color: c.grey,
    marginTop: 12,
  },

  /* ════════════════════════════════════════
     FOOTER — Absolute bottom
     ════════════════════════════════════════ */
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 52,
    right: 52,
    borderTopWidth: 0.5,
    borderTopColor: c.rule,
    paddingTop: 10,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  footerCol: {
    maxWidth: '48%',
  },
  footerBrand: {
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    color: c.dark,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 3,
  },
  footerText: {
    fontSize: 6.5,
    fontFamily: 'Helvetica',
    color: c.lightGrey,
    lineHeight: 1.55,
  },
})

/* ── Helpers ── */

interface InvoicePDFProps {
  invoice: Invoice
  profile: Profile
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '\u2014'
  const d = new Date(dateStr)
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })
}

function fmtEur(n: number): string {
  const formatted = new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n)
  return `${formatted}\u00a0€`
}

const unitLabels: Record<string, string> = {
  h: 'Heure',
  forfait: 'Forfait',
  jour: 'Jour',
}

/* ══════════════════════════════════════════════════════════
   COMPONENT
   ══════════════════════════════════════════════════════════ */

export function InvoicePDFTemplate({ invoice, profile }: InvoicePDFProps) {
  const items = invoice.items ?? []
  const ht = calculateHT(items)
  const tvaRate = invoice.tva_rate ?? 0
  const tva = calculateTVA(ht, tvaRate)
  const ttc = calculateTTC(ht, tvaRate)
  const isTvaExempt = tvaRate === 0

  return (
    <Document>
      <Page size="A4" style={styles.page}>

        {/* ═══════════════════════════════════
            HEADER
            ═══════════════════════════════════ */}
        <View style={styles.header}>

          {/* ── Left: FACTURE + Logo + Sender ── */}
          <View style={styles.headerLeft}>
            <Text style={styles.factureTitle}>Facture</Text>

            {/* Logo — eCons Freelance brand mark */}
            <Image src={LOGO_PATH} style={styles.logo} />

            <Text style={styles.senderName}>
              {profile.company_name ?? profile.full_name ?? 'Freelance'}
            </Text>
            {profile.address && (
              <Text style={styles.senderLine}>{profile.address}</Text>
            )}
            {profile.email && (
              <Text style={styles.senderLine}>{profile.email}</Text>
            )}
            {profile.siret && (
              <Text style={styles.senderLine}>SIRET : {profile.siret}</Text>
            )}
            {profile.tva_number && (
              <Text style={styles.senderLine}>TVA : {profile.tva_number}</Text>
            )}
          </View>

          {/* ── Right: Metadata grid ── */}
          <View style={styles.headerRight}>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Numero</Text>
              <Text style={styles.metaValue}>{invoice.invoice_number}</Text>
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Date</Text>
              <Text style={styles.metaValue}>{formatDate(invoice.issue_date)}</Text>
            </View>
            {invoice.due_date && (
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Echeance</Text>
                <Text style={styles.metaValue}>{formatDate(invoice.due_date)}</Text>
              </View>
            )}
            {invoice.client?.name && (
              <View style={[styles.metaRow, { marginTop: 8 }]}>
                <Text style={styles.metaLabel}>Client</Text>
                <Text style={styles.metaValue}>{invoice.client.name}</Text>
              </View>
            )}
            {invoice.project?.name && (
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Projet</Text>
                <Text style={styles.metaValue}>{invoice.project.name}</Text>
              </View>
            )}
          </View>
        </View>

        {/* ═══════════════════════════════════
            SEPARATOR
            ═══════════════════════════════════ */}
        <View style={styles.separator} />

        {/* ═══════════════════════════════════
            CLIENT BLOCK
            ═══════════════════════════════════ */}
        <View style={styles.clientSection}>
          <Text style={styles.sectionLabel}>Facturer a</Text>
          <Text style={styles.clientName}>
            {invoice.client?.name ?? 'Client'}
          </Text>
          {invoice.client?.address && (
            <Text style={styles.clientLine}>{invoice.client.address}</Text>
          )}
          {invoice.client?.email && (
            <Text style={styles.clientLine}>{invoice.client.email}</Text>
          )}
          {invoice.client?.fiscal_id && (
            <Text style={styles.clientLine}>ID Fiscal : {invoice.client.fiscal_id}</Text>
          )}
        </View>

        {/* ═══════════════════════════════════
            DELIVERABLES TABLE
            ═══════════════════════════════════ */}
        <View style={styles.table}>

          {/* Table Header */}
          <View style={styles.tableHeader}>
            <View style={styles.colDesc}>
              <Text style={styles.thText}>Description</Text>
            </View>
            <View style={styles.colQty}>
              <Text style={[styles.thText, { textAlign: 'right' }]}>Qte</Text>
            </View>
            <View style={styles.colPU}>
              <Text style={[styles.thText, { textAlign: 'right' }]}>PU</Text>
            </View>
            <View style={styles.colTotal}>
              <Text style={[styles.thText, { textAlign: 'right' }]}>Total HT</Text>
            </View>
          </View>

          {/* Table Rows */}
          {items.map((item, idx) => {
            const rowTotal = item.quantity * item.unit_price
            const unit = unitLabels[item.unit_type] ?? item.unit_type
            return (
              <View key={idx} style={styles.tableRow}>
                <View style={styles.colDesc}>
                  <Text style={styles.tdText}>{item.description}</Text>
                  <Text style={{ fontSize: 7, color: c.lightGrey, marginTop: 1 }}>
                    {unit}
                  </Text>
                </View>
                <View style={styles.colQty}>
                  <Text style={[styles.tdText, { textAlign: 'right' }]}>
                    {item.quantity}
                  </Text>
                </View>
                <View style={styles.colPU}>
                  <Text style={[styles.tdText, { textAlign: 'right' }]}>
                    {fmtEur(item.unit_price)}
                  </Text>
                </View>
                <View style={styles.colTotal}>
                  <Text style={[styles.tdBold, { textAlign: 'right' }]}>
                    {fmtEur(rowTotal)}
                  </Text>
                </View>
              </View>
            )
          })}
        </View>

        {/* ═══════════════════════════════════
            TOTALS
            ═══════════════════════════════════ */}
        <View style={styles.totalsWrapper}>
          <View style={styles.totalsBox}>
            {/* Total HT */}
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total HT</Text>
              <Text style={styles.totalValue}>{fmtEur(ht)}</Text>
            </View>

            {/* TVA */}
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>
                TVA {isTvaExempt ? '(0%)' : `(${tvaRate}%)`}
              </Text>
              <Text style={styles.totalValue}>{fmtEur(tva)}</Text>
            </View>

            {/* TOTAL TTC — Bold + thick top border + double underline */}
            <View style={styles.ttcRow}>
              <Text style={styles.ttcLabel}>Total TTC</Text>
              <Text style={styles.ttcValue}>{fmtEur(ttc)}</Text>
            </View>
            <View style={styles.ttcUnderline} />
          </View>
        </View>

        {/* ═══════════════════════════════════
            NOTES
            ═══════════════════════════════════ */}
        {invoice.notes && (
          <View style={styles.notesBox}>
            <Text style={styles.notesTitle}>Notes</Text>
            <Text style={styles.notesText}>{invoice.notes}</Text>
          </View>
        )}

        {/* ═══════════════════════════════════
            PAYMENT & LEGAL — Bottom Left
            ═══════════════════════════════════ */}
        {(profile.iban || profile.payment_link || isTvaExempt) && (
          <View style={styles.paymentBox}>

            {(profile.iban || profile.payment_link) && (
              <>
                <Text style={styles.paymentTitle}>Modalites de paiement</Text>

                {profile.iban && (
                  <View style={styles.paymentRow}>
                    <Text style={styles.paymentLabel}>IBAN</Text>
                    <Text style={styles.paymentValue}>{profile.iban}</Text>
                  </View>
                )}

                {profile.payment_link && (
                  <View style={styles.paymentRow}>
                    <Text style={styles.paymentLabel}>Paiement en ligne</Text>
                    <Text style={styles.paymentLink}>{profile.payment_link}</Text>
                  </View>
                )}
              </>
            )}

            {/* Legal: TVA exemption notice */}
            {isTvaExempt && (
              <Text style={styles.legalText}>
                TVA non applicable, art. 293 B du CGI
              </Text>
            )}
          </View>
        )}

        {/* ═══════════════════════════════════
            FOOTER — Absolute bottom
            ═══════════════════════════════════ */}
        <View style={styles.footer}>
          <View style={styles.footerRow}>
            {/* Left: Brand + identity */}
            <View style={styles.footerCol}>
              <Text style={styles.footerBrand}>eCons</Text>
              <Text style={styles.footerText}>
                {profile.company_name ?? profile.full_name ?? 'eCons Freelance'}
                {profile.email ? ` — ${profile.email}` : ''}
              </Text>
              {profile.siret && (
                <Text style={styles.footerText}>
                  SIRET : {profile.siret}
                  {profile.tva_number ? ` | TVA : ${profile.tva_number}` : ''}
                </Text>
              )}
            </View>

            {/* Right: Legal mentions */}
            <View style={[styles.footerCol, { alignItems: 'flex-end' }]}>
              <Text style={[styles.footerText, { textAlign: 'right' }]}>
                Paiement a reception de facture
              </Text>
              <Text style={[styles.footerText, { textAlign: 'right' }]}>
                Penalite de retard : 3x le taux d{"'"}interet legal
              </Text>
              <Text style={[styles.footerText, { textAlign: 'right' }]}>
                Indemnite forfaitaire de recouvrement : 40,00 €
              </Text>
            </View>
          </View>
        </View>

      </Page>
    </Document>
  )
}
