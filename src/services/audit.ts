import { supabase } from '../lib/supabase';

export interface AuditLogData {
  userId?: string;
  applicationId?: string;
  action: string;
  details: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

export async function auditLog(data: AuditLogData) {
  try {
    // Get client IP and user agent
    const ipAddress = data.ipAddress || await getClientIP();
    const userAgent = data.userAgent || navigator.userAgent;

    await supabase
      .from('kyc_audit_logs')
      .insert({
        user_id: data.userId || null,
        application_id: data.applicationId || null,
        action: data.action,
        details: data.details,
        ip_address: ipAddress,
        user_agent: userAgent
      });
  } catch (error) {
    console.error('Audit log error:', error);
    // Don't throw error to avoid breaking main functionality
  }
}

async function getClientIP(): Promise<string> {
  try {
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    return data.ip;
  } catch (error) {
    return '0.0.0.0';
  }
}