// types/audit.ts
export type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE' | 'APPROVE' | 'LOCK' | 'UNLOCK';

export interface AuditData {
  [key: string]: 
    | string 
    | number 
    | boolean 
    | null 
    | AuditData 
    | Array<string | number | boolean | null | AuditData>;
}

export interface AuditLog {
  id: string;
  entity_type: string;
  entity_id: string;
  action: AuditAction;
  performed_by: string | null;
   old_data: AuditData | null;  
  new_data: AuditData | null;  
  created_at: string;
  
  // Joined data
  performer?: {
    id: string;
    email: string;
    full_name?: string;
  };
}

export interface AuditLogFilters {
  startDate?: string;
  endDate?: string;
  action?: AuditAction | 'ALL';
  entityType?: string | 'ALL';
  search?: string;
}