export interface TeamMember {
  id: string
  full_name: string
  email: string
  phone?: string
  role: string
  department: string
  position?: string
  employee_id?: string
  hire_date?: string
  status: "active" | "inactive" | "on_leave" | "terminated"
  location?: string
  supervisor_id?: string
  avatar_url?: string
  skills?: string[]
  certifications?: string[]
  created_at: string
  updated_at: string
  user_id?: string
}

export const TEAM_MEMBERS: TeamMember[] = [
  {
    id: "1",
    full_name: "John Floor Worker",
    email: "john.floor@canopusworks.com",
    phone: "+1 (555) 111-1111",
    role: "Production Worker",
    department: "Production",
    location: "Factory Floor A",
    hire_date: "2023-01-15",
    status: "inactive",
    created_at: "2023-01-15T00:00:00Z",
    updated_at: "2023-01-15T00:00:00Z",
  },
  {
    id: "2",
    full_name: "Sarah Assembly",
    email: "sarah.assembly@canopusworks.com",
    phone: "+1 (555) 222-2222",
    role: "Assembly Specialist",
    department: "Production",
    location: "Assembly Line B",
    hire_date: "2023-02-20",
    status: "inactive",
    created_at: "2023-02-20T00:00:00Z",
    updated_at: "2023-02-20T00:00:00Z",
  },
  {
    id: "3",
    full_name: "Mike Quality",
    email: "mike.quality@canopusworks.com",
    phone: "+1 (555) 333-3333",
    role: "Quality Inspector",
    department: "Quality",
    location: "QC Lab",
    hire_date: "2023-03-10",
    status: "inactive",
    created_at: "2023-03-10T00:00:00Z",
    updated_at: "2023-03-10T00:00:00Z",
  },
  {
    id: "4",
    full_name: "Lisa Maintenance",
    email: "lisa.maintenance@canopusworks.com",
    phone: "+1 (555) 444-4444",
    role: "Maintenance Tech",
    department: "Maintenance",
    location: "Maintenance Bay",
    hire_date: "2023-04-05",
    status: "inactive",
    created_at: "2023-04-05T00:00:00Z",
    updated_at: "2023-04-05T00:00:00Z",
  },
  {
    id: "5",
    full_name: "David Safety",
    email: "david.safety@canopusworks.com",
    phone: "+1 (555) 555-5555",
    role: "Safety Officer",
    department: "Safety",
    location: "Safety Office",
    hire_date: "2023-05-12",
    status: "inactive",
    created_at: "2023-05-12T00:00:00Z",
    updated_at: "2023-05-12T00:00:00Z",
  },
]
