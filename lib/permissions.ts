export type Role = 'ADMIN' | 'STAFF' | 'DOCTOR' | 'PATIENT';

export const PERMISSIONS = {
  ADMIN: [
    'USER_MANAGE',
    'DOCTOR_PATIENT_ASSIGN',
    'AUDIT_VIEW_ALL',
    'SECURITY_MONITOR',
    'INTEGRITY_VIEW_ALL',
    'EMERGENCY_ACCESS_VIEW',
    'CORRECTION_REVIEW',
    'RECORD_VIEW_ALL',
    'SYSTEM_CONFIG',
  ],
  STAFF: [
    'USER_MANAGE',
    'DOCTOR_PATIENT_ASSIGN',
    'AUDIT_VIEW_ALL',
    'SECURITY_MONITOR',
    'INTEGRITY_VIEW_ALL',
    'EMERGENCY_ACCESS_VIEW',
    'APPOINTMENT_MANAGE',
  ],
  DOCTOR: [
    'PATIENT_VIEW_ASSIGNED',
    'RECORD_CREATE',
    'RECORD_VERSION_CREATE',
    'CORRECTION_REQUEST_CREATE',
    'VOICE_RECORD_UPLOAD',
    'INTEGRITY_VERIFY',
    'EMERGENCY_ACCESS_REQUEST',
    'APPOINTMENT_VIEW_DOCTOR',
  ],
  PATIENT: [
    'RECORD_VIEW_OWN',
    'CORRECTION_REQUEST_CREATE',
    'VOICE_LISTEN_OWN',
    'AUDIT_VIEW_OWN',
    'INTEGRITY_VERIFY_OWN',
    'APPOINTMENT_VIEW_OWN',
  ],
} as const;

export function hasPermission(role: Role, permission: string): boolean {
  const rolePermissions = PERMISSIONS[role] as readonly string[] | undefined;
  return rolePermissions ? rolePermissions.includes(permission) : false;
}
