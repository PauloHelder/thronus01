export interface Member {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: 'Active' | 'Inactive' | 'Visitor';
  avatar: string;
  gender?: 'Male' | 'Female';
  maritalStatus?: 'Single' | 'Married' | 'Divorced' | 'Widowed';
  birthDate?: string;
  churchRole?: string;
  isBaptized?: boolean;
  baptismDate?: string;
  address?: string;
  neighborhood?: string;
  district?: string;
  province?: string;
  country?: string;
  municipality?: string;
  groupId?: string;
  biNumber?: string;
}

export interface Plan {
  id: string;
  name: string;
  price: number;
  billing_period: string;
  features: {
    canLinkToSupervision: boolean;
    canBeLinked: number | 'unlimited'; // número de igrejas que podem ser vinculadas
    customBranding: boolean;
    maxMembers: number | 'unlimited';
    maxGroups: number | 'unlimited';
    serviceStatistics: boolean;
    exportStatistics: boolean;
    exportFinances: boolean;
    maxLeaders: number | 'unlimited';
    maxDisciples: number | 'unlimited';
    maxDepartments: number | 'unlimited';
    maxClasses: number | 'unlimited';
    maxEvents: number;
  };
  is_active: boolean;
  description?: string;
  is_popular?: boolean;
}

export interface Subscription {
  id: string;
  churchId: string;
  planId: string;
  duration: 1 | 3 | 6 | 12; // meses
  startDate: string;
  endDate: string;
  status: 'active' | 'expired' | 'cancelled';
  totalAmount: number;
}

export interface Event {
  id: string;
  title: string;
  date: string; // ISO date string or display string
  time: string;
  type: string;
  description?: string;
  attendees?: string[]; // IDs dos participantes
  coverUrl?: string;
}

export interface Donation {
  id: string;
  donorName: string;
  donorAvatar?: string;
  amount: number;
  date: string;
  fund: string;
  method: string;
}

export interface GroupMember {
  member: Member;
  role: 'Líder' | 'Co-líder' | 'Membro' | 'Secretário' | 'Visitante';
}

export interface Group {
  id: string;
  name: string;
  leaderId?: string;
  coLeaderId?: string;
  leaders: Member[];
  members: GroupMember[];
  memberCount: number;
  meetingTime: string;
  meetingPlace?: string;
  address?: string;
  neighborhood?: string;
  district?: string;
  province?: string;
  country?: string;
  municipality?: string;
  status: 'Active' | 'Full' | 'Inactive';
  meetings?: GroupMeeting[];
}

export interface GroupMeeting {
  id: string;
  groupId: string;
  date: string;
  attendees: string[]; // Array of member IDs
  notes?: string;
}

export interface Department {
  id: string;
  name: string;
  icon: string;
  description?: string;
  leaderId?: string;
  coLeaderId?: string;
  leader?: Member;
  coLeader?: Member;
  members: Member[];
  schedules?: DepartmentSchedule[];
  isDefault?: boolean; // Para departamentos padrão (Secretaria, Finanças, Louvor)
}

export interface DepartmentSchedule {
  id: string;
  departmentId: string;
  type: 'Service' | 'Event';
  serviceId?: string;
  eventId?: string;
  date: string;
  assignedMembers: string[]; // IDs dos membros escalados
  notes?: string;
}

export interface TeachingClass {
  id: string;
  name: string;
  teacherId: string;
  teacher?: Member;
  stage: string; // Estágio da carreira cristã (configurável)
  dayOfWeek: 'Segunda' | 'Terça' | 'Quarta' | 'Quinta' | 'Sexta' | 'Sábado' | 'Domingo';
  time: string; // Formato HH:MM
  room: string;
  startDate: string;
  endDate?: string;
  category: string; // Categoria configurável (Homogenia, Adultos, Jovens, etc)
  status: 'Agendado' | 'Agendada' | 'Em Andamento' | 'Concluído' | 'Concluída' | 'Cancelado' | 'Cancelada';
  students: Member[];
  lessons?: TeachingLesson[];
}

export interface TeachingLesson {
  id: string;
  classId: string;
  date: string;
  title: string;
  attendance: string[]; // IDs dos alunos presentes
  notes?: string;
}

export interface ChristianStage {
  id: string;
  name: string;
  description?: string;
  order: number;
}

export interface TeachingCategory {
  id: string;
  name: string;
  description?: string;
}

export interface Service {
  id: string;
  churchId: string;
  serviceTypeId: string;
  typeName: string; // Nome do tipo para exibição
  status: 'Agendado' | 'Concluído' | 'Cancelado';
  date: string;
  startTime: string;
  preacher: string;
  leader: string;
  location: string;
  description?: string;
  statistics?: {
    adults: {
      men: number;
      women: number;
    };
    children: {
      boys: number;
      girls: number;
    };
    visitors: {
      men: number;
      women: number;
    };
  };
}

export interface TransactionCategory {
  id: string;
  name: string;
  type: 'Income' | 'Expense';
  isSystem?: boolean;
}

export interface Transaction {
  id: string;
  type: 'Income' | 'Expense';
  categoryId: string;
  amount: number;
  date: string;
  source: 'Service' | 'Member' | 'Other';
  sourceId?: string;
  sourceName?: string;
  receiptNumber?: string;
  referenceNumber?: string;
  description?: string;
}

export interface DiscipleshipLeader {
  id: string;
  member: Member;
  startDate: string;
  disciples: Member[];
  meetings?: DiscipleshipMeeting[];
}

export interface DiscipleshipMeeting {
  id: string;
  leaderId: string;
  date: string;
  attendees: string[]; // IDs dos discípulos presentes
  status: 'Scheduled' | 'Completed' | 'Cancelled';
  notes?: string;
}