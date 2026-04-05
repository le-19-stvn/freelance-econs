import React from 'react'
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import type { Invoice, Profile } from '@/types'
import { calculateHT, calculateTVA, calculateTTC } from '@/lib/utils/calculations'

/* ──────────────────────────────────────────────────────────
   Swiss Design Invoice — 100% Black & White, Strict Grid
   ────────────────────────────────────────────────────────── */

const c = {
  black: '#000000',
  dark: '#1A1A1A',
  grey: '#555555',
  lightGrey: '#999999',
  rule: '#CCCCCC',
  faintRule: '#E0E0E0',
  bgAlt: '#F5F5F5',
  white: '#FFFFFF',
}

const styles = StyleSheet.create({
  page: {
    padding: 48,
    paddingBottom: 100,
    fontSize: 9,
    fontFamily: 'Helvetica',
    color: c.dark,
    backgroundColor: c.white,
  },

  /* ── Top rule ── */
  topRule: {
    borderTopWidth: 4,
    borderTopColor: c.black,
    marginBottom: 32,
  },

  /* ── Header ── */
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  headerLeft: { maxWidth: '55%' },
  headerRight: { alignItems: 'flex-end', maxWidth: '40%' },
  brandName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: c.black,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  brandSub: {
    fontSize: 7,
    color: c.lightGrey,
    letterSpacing: 3,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  infoText: { fontSize: 8.5, color: c.dark, lineHeight: 1.6 },
  infoMuted: { fontSize: 8, color: c.grey, lineHeight: 1.6 },

  /* ── Invoice title block ── */
  invoiceTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: c.black,
    letterSpacing: 3,
    textTransform: 'uppercase',
  },
  invoiceNumber: {
    fontSize: 10,
    color: c.dark,
    fontWeight: 'bold',
    marginTop: 4,
    marginBottom: 8,
  },

  /* ── Divider ── */
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: c.rule,
    marginBottom: 24,
  },

  /* ── Meta ── */
  metaSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  metaBlock: {},
  label: {
    fontSize: 7,
    color: c.lightGrey,
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: 4,
    marginTop: 8,
  },
  clientName: { fontSize: 11, fontWeight: 'bold', color: c.black, marginBottom: 2 },
  clientDetail: { fontSize: 8.5, color: c.dark, lineHeight: 1.6 },

  /* ── Table ── */
  table: { marginBottom: 24 },
  tableHeader: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 0,
    borderBottomWidth: 2,
    borderBottomColor: c.black,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 9,
    paddingHorizontal: 0,
    borderBottomWidth: 0.5,
    borderBottomColor: c.faintRule,
  },
  tableRowAlt: {
    backgroundColor: c.bgAlt,
  },
  thText: {
    fontWeight: 'bold',
    fontSize: 7,
    color: c.black,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  tdText: { fontSize: 9, color: c.dark },
  colDesc: { flex: 4, paddingRight: 8 },
  colQty: { flex: 1, textAlign: 'center' },
  colUnit: { flex: 1.2, textAlign: 'center' },
  colPrice: { flex: 1.3, textAlign: 'right' },
  colTotal: { flex: 1.3, textAlign: 'right' },

  /* ── Totals ── */
  totalsWrapper: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 24,
  },
  totalsBox: {
    width: 220,
    borderTopWidth: 1,
    borderTopColor: c.rule,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 7,
    paddingHorizontal: 0,
  },
  totalLabel: { fontSize: 9, color: c.grey },
  totalValue: { fontSize: 9, fontWeight: 'bold', color: c.dark },
  ttcRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: c.black,
  },
  ttcLabel: { fontSize: 11, fontWeight: 'bold', color: c.white },
  ttcValue: { fontSize: 11, fontWeight: 'bold', color: c.white },

  /* ── Notes ── */
  notesBox: {
    marginTop: 8,
    padding: 14,
    borderLeftWidth: 3,
    borderLeftColor: c.black,
    backgroundColor: c.bgAlt,
  },
  notesTitle: {
    fontSize: 7,
    fontWeight: 'bold',
    color: c.black,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  notesText: { fontSize: 9, color: c.dark, lineHeight: 1.6 },

  /* ── Payment details ── */
  paymentBox: {
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: c.faintRule,
  },
  paymentTitle: {
    fontSize: 7,
    fontWeight: 'bold',
    color: c.dark,
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: 8,
  },
  paymentRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  paymentLabel: {
    fontSize: 8,
    fontWeight: 'bold',
    color: c.dark,
    width: 100,
  },
  paymentValue: {
    fontSize: 8.5,
    color: c.dark,
    flex: 1,
    fontFamily: 'Courier',
  },
  paymentLink: {
    fontSize: 8.5,
    color: c.dark,
    flex: 1,
    textDecoration: 'underline',
  },

  /* ── Footer ── */
  footer: {
    position: 'absolute',
    bottom: 28,
    left: 48,
    right: 48,
    borderTopWidth: 1,
    borderTopColor: c.rule,
    paddingTop: 10,
    textAlign: 'center',
  },
  footerText: { fontSize: 7, color: c.lightGrey, lineHeight: 1.6 },
  footerBrand: {
    fontSize: 8,
    fontWeight: 'bold',
    color: c.black,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
})

interface InvoicePDFProps {
  invoice: Invoice
  profile: Profile
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })
}

function fmtEur(n: number): string {
  return n.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' \u20AC'
}

const unitLabels: Record<string, string> = { h: 'Heure', forfait: 'Forfait', jour: 'Jour' }

export function InvoicePDFTemplate({ invoice, profile }: InvoicePDFProps) {
  const items = invoice.items ?? []
  const ht = calculateHT(items)
  const tva = calculateTVA(ht, invoice.tva_rate)
  const ttc = calculateTTC(ht, invoice.tva_rate)

  return (
    <Document>
      <Page size="A4" style={styles.page}>

        {/* ═══ TOP RULE — Bold black line ═══ */}
        <View style={styles.topRule} />

        {/* ═══ HEADER — Freelancer info ═══ */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.brandName}>
              {profile.company_name ?? profile.full_name ?? 'Freelance'}
            </Text>
            <Text style={styles.brandSub}>eCons Freelance</Text>
            {profile.address && <Text style={styles.infoText}>{profile.address}</Text>}
            {profile.email && <Text style={styles.infoText}>{profile.email}</Text>}
            {profile.siret && <Text style={styles.infoMuted}>SIRET : {profile.siret}</Text>}
            {profile.tva_number && <Text style={styles.infoMuted}>N° TVA : {profile.tva_number}</Text>}
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.invoiceTitle}>FACTURE</Text>
            <Text style={styles.invoiceNumber}>N° {invoice.invoice_number}</Text>
            <Text style={styles.infoMuted}>Date : {formatDate(invoice.issue_date)}</Text>
            {invoice.due_date && (
              <Text style={styles.infoMuted}>Echeance : {formatDate(invoice.due_date)}</Text>
            )}
          </View>
        </View>

        {/* ═══ DIVIDER ═══ */}
        <View style={styles.divider} />

        {/* ═══ CLIENT BLOCK ═══ */}
        <View style={styles.metaSection}>
          <View style={styles.metaBlock}>
            <Text style={styles.label}>Facture a</Text>
            <Text style={styles.clientName}>{invoice.client?.name ?? 'Client'}</Text>
            {invoice.client?.address && <Text style={styles.clientDetail}>{invoice.client.address}</Text>}
            {invoice.client?.email && <Text style={styles.clientDetail}>{invoice.client.email}</Text>}
            {invoice.client?.fiscal_id && (
              <Text style={styles.clientDetail}>ID Fiscal : {invoice.client.fiscal_id}</Text>
            )}
          </View>
          {invoice.project?.name && (
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.label}>Projet</Text>
              <Text style={{ fontSize: 10, fontWeight: 'bold', color: c.black }}>{invoice.project.name}</Text>
            </View>
          )}
        </View>

        {/* ═══ ITEMS TABLE ═══ */}
        <View style={styles.table}>
          {/* Table Header */}
          <View style={styles.tableHeader}>
            <Text style={[styles.thText, styles.colDesc]}>Description</Text>
            <Text style={[styles.thText, styles.colQty]}>Qte</Text>
            <Text style={[styles.thText, styles.colUnit]}>Unite</Text>
            <Text style={[styles.thText, styles.colPrice]}>P.U. HT</Text>
            <Text style={[styles.thText, styles.colTotal]}>Total HT</Text>
          </View>
          {/* Table Rows */}
          {items.map((item, idx) => {
            const rowTotal = item.quantity * item.unit_price
            return (
              <View key={idx} style={[styles.tableRow, idx % 2 === 1 ? styles.tableRowAlt : {}]}>
                <Text style={[styles.tdText, styles.colDesc]}>{item.description}</Text>
                <Text style={[styles.tdText, styles.colQty]}>{item.quantity}</Text>
                <Text style={[styles.tdText, styles.colUnit]}>{unitLabels[item.unit_type] ?? item.unit_type}</Text>
                <Text style={[styles.tdText, styles.colPrice]}>{fmtEur(item.unit_price)}</Text>
                <Text style={[styles.tdText, styles.colTotal, { fontWeight: 'bold' }]}>{fmtEur(rowTotal)}</Text>
              </View>
            )
          })}
        </View>

        {/* ═══ TOTALS ═══ */}
        <View style={styles.totalsWrapper}>
          <View style={styles.totalsBox}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total HT</Text>
              <Text style={styles.totalValue}>{fmtEur(ht)}</Text>
            </View>
            <View style={[styles.totalRow, { borderTopWidth: 0.5, borderTopColor: c.rule }]}>
              <Text style={styles.totalLabel}>TVA ({invoice.tva_rate}%)</Text>
              <Text style={styles.totalValue}>{fmtEur(tva)}</Text>
            </View>
            <View style={styles.ttcRow}>
              <Text style={styles.ttcLabel}>Total TTC</Text>
              <Text style={styles.ttcValue}>{fmtEur(ttc)}</Text>
            </View>
          </View>
        </View>

        {/* ═══ NOTES ═══ */}
        {invoice.notes && (
          <View style={styles.notesBox}>
            <Text style={styles.notesTitle}>Notes / Conditions</Text>
            <Text style={styles.notesText}>{invoice.notes}</Text>
          </View>
        )}

        {/* ═══ PAYMENT DETAILS ═══ */}
        {(profile.iban || profile.payment_link) && (
          <View style={styles.paymentBox}>
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
          </View>
        )}

        {/* ═══ FOOTER — Legal mentions ═══ */}
        <View style={styles.footer}>
          <Text style={styles.footerBrand}>eCons</Text>
          <Text style={styles.footerText}>
            {profile.company_name ?? profile.full_name ?? 'eCons Freelance'} — {profile.email ?? ''}
          </Text>
          {profile.siret && (
            <Text style={styles.footerText}>
              SIRET : {profile.siret}{profile.tva_number ? ` | N° TVA : ${profile.tva_number}` : ''}
            </Text>
          )}
          <Text style={styles.footerText}>
            Paiement a reception de facture — En cas de retard, une penalite de 3x le taux d interet legal sera appliquee.
          </Text>
          <Text style={styles.footerText}>
            Indemnite forfaitaire pour frais de recouvrement : 40,00 EUR
          </Text>
        </View>

      </Page>
    </Document>
  )
}
