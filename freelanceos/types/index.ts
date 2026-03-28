export interface Profile {
  id: string
  full_name: string | null
  company_name: string | null
  email: string
  address: string | null
  siret: string | null
  tva_number: string | null
  tva_rate: number
  logo_url: string | null
}

export interface Client {
  id: string
  user_id: string
  name: string
  email: string | null
  phone: string | null
  fiscal_id: string | null
  address: string | null
  created_at: string
}

export type ProjectStatus = 'ongoing' | 'done'
export interface Project {
  id: string
  user_id: string
  client_id: string | null
  name: string
  description: string | null
  status: ProjectStatus
  deadline: string | null
  budget: number
  invoice_generated: boolean
  client?: Client
}

export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'late'
export type UnitType = 'h' | 'forfait' | 'jour'

export interface InvoiceItem {
  id?: string
  invoice_id?: string
  description: string
  quantity: number
  unit_type: UnitType
  unit_price: number
}

export interface Invoice {
  id: string
  user_id: string
  client_id: string | null
  project_id: string | null
  invoice_number: string
  status: InvoiceStatus
  issue_date: string
  due_date: string | null
  tva_rate: number
  notes: string | null
  pdf_url: string | null
  items: InvoiceItem[]
  client?: Client
  project?: Project
}
