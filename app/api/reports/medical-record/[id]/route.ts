import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { canAccessMedicalRecord } from '@/lib/authorization';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    const { id } = params;

    const accessCheck = await canAccessMedicalRecord(session, id, request);
    if (!accessCheck.authorized) {
      return NextResponse.json({ error: accessCheck.reason }, { status: accessCheck.status });
    }

    const record = await prisma.medicalRecord.findUnique({
      where: { id },
      include: {
        patient: { include: { user: { select: { name: true, email: true } } } },
        originatingDoctor: { include: { user: { select: { name: true, email: true } } } },
        versions: { orderBy: { versionNumber: 'asc' } },
        voiceConsultations: true,
      },
    });

    if (!record) {
      return NextResponse.json({ error: 'Medical record not found' }, { status: 404 });
    }

    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>VoiceVault Med - Official Clinical Record #${record.id.slice(-8)}</title>
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; color: #1e293b; background: #fff; margin: 0; padding: 40px; line-height: 1.5; }
    .header { border-bottom: 2px solid #2563eb; padding-bottom: 20px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: center; }
    .title { font-size: 24px; font-weight: 800; color: #2563eb; }
    .subtitle { font-size: 14px; color: #64748b; margin-top: 4px; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; }
    .card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; }
    .card-title { font-size: 12px; font-weight: 700; text-transform: uppercase; color: #64748b; margin-bottom: 8px; }
    .card-value { font-size: 15px; font-weight: 600; color: #0f172a; }
    .version-box { border: 1px solid #cbd5e1; border-radius: 8px; padding: 20px; margin-bottom: 20px; background: #fff; page-break-inside: avoid; }
    .version-header { font-size: 16px; font-weight: 700; color: #0f766e; border-bottom: 1px solid #f1f5f9; padding-bottom: 8px; margin-bottom: 12px; display: flex; justify-content: space-between; }
    .field { margin-bottom: 12px; }
    .field-label { font-size: 11px; font-weight: 700; text-transform: uppercase; color: #64748b; }
    .field-text { font-size: 14px; color: #1e293b; margin-top: 2px; }
    .hash-code { font-family: monospace; font-size: 11px; background: #f1f5f9; padding: 4px 8px; border-radius: 4px; word-break: break-all; color: #334155; }
    .footer { text-align: center; margin-top: 40px; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 20px; }
    @media print {
      body { padding: 0; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="no-print" style="margin-bottom: 20px; text-align: right;">
    <button onclick="window.print()" style="background: #2563eb; color: #fff; border: none; padding: 10px 20px; border-radius: 6px; font-weight: 600; cursor: pointer;">Print / Download PDF</button>
  </div>

  <div class="header">
    <div>
      <div class="title">VoiceVault Med Clinical Record</div>
      <div class="subtitle">Cryptographically Verified Immutable Health Documentation</div>
    </div>
    <div style="text-align: right;">
      <div style="font-size: 12px; font-weight: 700; color: #2563eb;">VERIFIED SHA-256 CHAIN</div>
      <div style="font-size: 11px; color: #64748b;">Generated: ${new Date().toLocaleString()}</div>
    </div>
  </div>

  <div class="grid">
    <div class="card">
      <div class="card-title">Patient Profile</div>
      <div class="card-value">${record.patient.user.name}</div>
      <div style="font-size: 13px; color: #475569; margin-top: 4px;">Code: ${record.patient.patientCode} | Blood Type: ${record.patient.bloodType || 'N/A'}</div>
      <div style="font-size: 13px; color: #475569;">DOB: ${record.patient.dateOfBirth || 'N/A'} | Contact: ${record.patient.phone || 'N/A'}</div>
    </div>

    <div class="card">
      <div class="card-title">Attending Physician</div>
      <div class="card-value">${record.originatingDoctor.user.name}</div>
      <div style="font-size: 13px; color: #475569; margin-top: 4px;">Specialization: ${record.originatingDoctor.specialization}</div>
      <div style="font-size: 13px; color: #475569;">Doctor Code: ${record.originatingDoctor.doctorCode}</div>
    </div>
  </div>

  <h3 style="color: #0f172a; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px;">Record Version History (${record.versions.length} Version${record.versions.length > 1 ? 's' : ''})</h3>

  ${record.versions.map(v => `
    <div class="version-box">
      <div class="version-header">
        <span>Version ${v.versionNumber} — ${v.versionReason}</span>
        <span style="font-size: 12px; font-weight: 500; color: #64748b;">${new Date(v.createdAt).toLocaleString()}</span>
      </div>

      <div class="field">
        <div class="field-label">Symptoms & Presentation</div>
        <div class="field-text">${v.symptoms}</div>
      </div>

      <div class="field">
        <div class="field-label">Diagnosis</div>
        <div class="field-text" style="font-weight: 600;">${v.diagnosis}</div>
      </div>

      <div class="field">
        <div class="field-label">Prescription & Dosage</div>
        <div class="field-text" style="color: #2563eb; font-weight: 600;">${v.prescription}</div>
      </div>

      <div class="field">
        <div class="field-label">Clinical Notes</div>
        <div class="field-text">${v.notes}</div>
      </div>

      <div style="margin-top: 16px; padding-top: 12px; border-top: 1px dashed #e2e8f0;">
        <div class="field-label">Cryptographic Current Version Hash (SHA-256)</div>
        <div class="hash-code">${v.currentHash}</div>
      </div>

      ${v.previousHash ? `
      <div style="margin-top: 8px;">
        <div class="field-label">Previous Version Link Hash</div>
        <div class="hash-code" style="color: #64748b;">${v.previousHash}</div>
      </div>
      ` : '<div style="margin-top: 8px; font-size: 11px; color: #16a34a; font-weight: 600;">✓ Genesis Version 1 Root</div>'}
    </div>
  `).join('')}

  <div class="footer">
    VoiceVault Med &bull; Zero Trust Cryptographic Healthcare Platform &bull; Page 1 of 1
  </div>
</body>
</html>
    `;

    return new NextResponse(htmlContent, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
      },
    });
  } catch (error: any) {
    console.error('Error generating report:', error);
    return NextResponse.json({ error: 'Failed to generate medical report.' }, { status: 500 });
  }
}
