import { describe, it, expect } from 'vitest';
import { requireAuthenticatedUser, requireRole } from '../lib/authorization';
import { SessionUser } from '../lib/auth';

describe('Zero Trust Authorization Policy Checks', () => {
  const patientUser: SessionUser = {
    id: 'user_pat_1',
    name: 'John Doe',
    email: 'john.doe@patient.med',
    role: 'PATIENT',
    status: 'ACTIVE',
    patientProfileId: 'pat_profile_1',
  };

  const doctorUser: SessionUser = {
    id: 'user_doc_1',
    name: 'Dr. Fleming',
    email: 'dr.smith@voicevault.med',
    role: 'DOCTOR',
    status: 'ACTIVE',
    doctorProfileId: 'doc_profile_1',
  };

  it('should reject unauthenticated request with 401', async () => {
    const result = await requireAuthenticatedUser(null);
    expect(result.authorized).toBe(false);
    expect(result.status).toBe(401);
  });

  it('should reject inactive account with 403', async () => {
    const inactiveUser: SessionUser = { ...patientUser, status: 'INACTIVE' };
    const result = await requireAuthenticatedUser(inactiveUser);
    expect(result.authorized).toBe(false);
    expect(result.status).toBe(403);
    expect(result.reason).toContain('inactive');
  });

  it('should enforce role permissions correctly', async () => {
    // Patient attempting STAFF role action
    const staffCheck = await requireRole(patientUser, ['STAFF']);
    expect(staffCheck.authorized).toBe(false);
    expect(staffCheck.status).toBe(403);

    // Doctor attempting DOCTOR role action
    const doctorCheck = await requireRole(doctorUser, ['DOCTOR']);
    expect(doctorCheck.authorized).toBe(true);
    expect(doctorCheck.status).toBe(200);
  });
});
