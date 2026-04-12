import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Button,
  Hr,
  Preview,
} from '@react-email/components'
import * as React from 'react'

interface InvoiceEmailProps {
  freelanceName: string
  clientName: string
  invoiceNumber: string
  totalAmount: string
  dueDate: string
  invoiceUrl?: string
  paymentLink?: string
}

export default function InvoiceEmail({
  freelanceName = 'Freelance',
  clientName = 'Client',
  invoiceNumber = 'FAC-2026-001',
  totalAmount = '0,00\u00a0\u20ac',
  dueDate = '—',
  invoiceUrl = '#',
  paymentLink,
}: InvoiceEmailProps) {
  return (
    <Html lang="fr">
      <Head />
      <Preview>Facture {invoiceNumber} — {totalAmount}</Preview>
      <Body style={body}>
        <Container style={container}>
          {/* Header accent */}
          <Section style={headerAccent} />

          {/* Content */}
          <Section style={content}>
            {/* Brand */}
            <Text style={brand}>FACTURE</Text>
            <Text style={invoiceNum}>{invoiceNumber}</Text>

            <Hr style={divider} />

            {/* Greeting */}
            <Text style={paragraph}>
              Bonjour {clientName},
            </Text>

            <Text style={paragraph}>
              Veuillez trouver ci-joint la facture <strong>{invoiceNumber}</strong> d&apos;un montant de <strong>{totalAmount}</strong>.
            </Text>

            {/* Amount highlight */}
            <Section style={amountBox}>
              <Text style={amountLabel}>MONTANT TTC</Text>
              <Text style={amountValue}>{totalAmount}</Text>
              <Text style={amountDue}>
                Date d&apos;échéance : {dueDate}
              </Text>
            </Section>

            {/* CTA */}
            <Section style={{ textAlign: 'center' as const, marginTop: '28px', marginBottom: paymentLink ? '12px' : '28px' }}>
              <Button style={button} href={invoiceUrl}>
                Consulter la facture
              </Button>
            </Section>

            {paymentLink && (
              <Section style={{ textAlign: 'center' as const, marginBottom: '28px' }}>
                <Button style={payButton} href={paymentLink}>
                  Payer maintenant
                </Button>
              </Section>
            )}

            <Hr style={divider} />

            {/* Sign-off */}
            <Text style={paragraph}>
              Cordialement,
            </Text>
            <Text style={{ ...paragraph, fontWeight: 600, color: '#0F1117' }}>
              {freelanceName}
            </Text>
          </Section>

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>
              Ce message a été envoyé automatiquement via eCons Freelance.
            </Text>
            <Text style={footerText}>
              La facture est jointe à cet email au format PDF.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

/* ── Styles ── */
const body: React.CSSProperties = {
  backgroundColor: '#F6F7FA',
  fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
  margin: 0,
  padding: 0,
}

const container: React.CSSProperties = {
  maxWidth: '560px',
  margin: '0 auto',
  padding: '40px 0',
}

const headerAccent: React.CSSProperties = {
  height: '4px',
  background: 'linear-gradient(90deg, #1A3FA3 0%, #00B4D8 100%)',
  borderRadius: '8px 8px 0 0',
}

const content: React.CSSProperties = {
  backgroundColor: '#FFFFFF',
  padding: '40px 40px 32px',
  borderLeft: '1px solid #E4E6ED',
  borderRight: '1px solid #E4E6ED',
}

const brand: React.CSSProperties = {
  fontSize: '11px',
  fontWeight: 700,
  letterSpacing: '2px',
  color: '#6B7280',
  textTransform: 'uppercase' as const,
  margin: '0 0 4px',
}

const invoiceNum: React.CSSProperties = {
  fontSize: '22px',
  fontWeight: 800,
  color: '#1A3FA3',
  margin: '0 0 20px',
}

const divider: React.CSSProperties = {
  borderColor: '#E4E6ED',
  borderWidth: '1px 0 0 0',
  margin: '20px 0',
}

const paragraph: React.CSSProperties = {
  fontSize: '15px',
  lineHeight: '1.6',
  color: '#2C2F3A',
  margin: '0 0 12px',
}

const amountBox: React.CSSProperties = {
  backgroundColor: '#EBF2FA',
  borderRadius: '8px',
  padding: '20px 24px',
  textAlign: 'center' as const,
  margin: '24px 0',
}

const amountLabel: React.CSSProperties = {
  fontSize: '10px',
  fontWeight: 600,
  letterSpacing: '1.5px',
  color: '#6B7280',
  margin: '0 0 6px',
}

const amountValue: React.CSSProperties = {
  fontSize: '28px',
  fontWeight: 800,
  color: '#1A3FA3',
  margin: '0 0 6px',
}

const amountDue: React.CSSProperties = {
  fontSize: '13px',
  color: '#6B7280',
  margin: 0,
}

const button: React.CSSProperties = {
  backgroundColor: '#1A3FA3',
  color: '#FFFFFF',
  fontSize: '14px',
  fontWeight: 700,
  padding: '12px 32px',
  borderRadius: '6px',
  textDecoration: 'none',
  display: 'inline-block',
}

const payButton: React.CSSProperties = {
  backgroundColor: '#059669',
  color: '#FFFFFF',
  fontSize: '14px',
  fontWeight: 700,
  padding: '12px 32px',
  borderRadius: '6px',
  textDecoration: 'none',
  display: 'inline-block',
}

const footer: React.CSSProperties = {
  backgroundColor: '#FFFFFF',
  padding: '16px 40px 24px',
  borderLeft: '1px solid #E4E6ED',
  borderRight: '1px solid #E4E6ED',
  borderBottom: '1px solid #E4E6ED',
  borderRadius: '0 0 8px 8px',
}

const footerText: React.CSSProperties = {
  fontSize: '11px',
  color: '#6B7280',
  margin: '0 0 4px',
  textAlign: 'center' as const,
}
