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
  avatar_url: string | null
}

export interface Workspace {
  id: string
  name: string
  created_at: string
}

export type WorkspaceRole = 'owner' | 'admin' | 'member'

export interface WorkspaceMember {
  workspace_id: string
  user_id: string
  role: WorkspaceRole
  created_at: string
  // Joined from profiles
  profile?: Profile
}

export interface Client {
  id: string
  user_id: string
  workspace_id: string | null
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
  workspace_id: string | null
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
  workspace_id: string | null
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

/* ── Freelance Collective (Team Operations) ── */

export interface Team {
  id: string
  name: string
  created_by: string
  created_at: string
}

export type TeamRole = 'owner' | 'admin' | 'member'

export interface TeamMember {
  id: string
  team_id: string
  user_id: string
  role: TeamRole
  created_at: string
  email?: string
  full_name?: string | null
}

export interface TeamProject {
  id: string
  team_id: string
  name: string
  description: string | null
  created_at: string
}

export type TaskStatus = 'todo' | 'in_progress' | 'done'

export interface TeamTask {
  id: string
  project_id: string
  title: string
  description: string | null
  status: TaskStatus
  assigned_to: string | null
  position: number
  created_at: string
  assignee_name?: string | null
}
