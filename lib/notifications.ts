import { prisma } from './db';

export type NotificationType =
  | 'RECORD_CREATED'
  | 'CORRECTION_REQUESTED'
  | 'CORRECTION_APPROVED'
  | 'CORRECTION_REJECTED'
  | 'VOICE_UPLOADED'
  | 'INTEGRITY_FAILURE'
  | 'EMERGENCY_ACCESS'
  | 'SYSTEM';

export interface CreateNotificationInput {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  resourceType?: string;
  resourceId?: string;
}

/**
 * Creates an in-app notification for a user.
 */
export async function createNotification(input: CreateNotificationInput) {
  try {
    return await prisma.notification.create({
      data: {
        userId: input.userId,
        type: input.type,
        title: input.title,
        message: input.message,
        resourceType: input.resourceType || null,
        resourceId: input.resourceId || null,
      },
    });
  } catch (error) {
    console.error('Failed to create notification:', error);
  }
}

/**
 * Notifies multiple users at once.
 */
export async function createNotifications(inputs: CreateNotificationInput[]) {
  await Promise.all(inputs.map((input) => createNotification(input)));
}

/**
 * Notifies patient and assigned doctors about a record event.
 */
export async function notifyPatientAndDoctors(
  patientProfileId: string,
  notification: Omit<CreateNotificationInput, 'userId'>
) {
  const patient = await prisma.patientProfile.findUnique({
    where: { id: patientProfileId },
    select: { userId: true },
  });

  const assignments = await prisma.doctorPatientAssignment.findMany({
    where: { patientId: patientProfileId, active: true },
    include: { doctor: { select: { userId: true } } },
  });

  const userIds = new Set<string>();
  if (patient) userIds.add(patient.userId);
  assignments.forEach((a) => userIds.add(a.doctor.userId));

  await createNotifications(
    Array.from(userIds).map((userId) => ({ ...notification, userId }))
  );
}

/**
 * Notifies all staff administrators.
 */
export async function notifyStaff(notification: Omit<CreateNotificationInput, 'userId'>) {
  const staff = await prisma.user.findMany({
    where: { role: 'STAFF', status: 'ACTIVE' },
    select: { id: true },
  });

  await createNotifications(staff.map((s) => ({ ...notification, userId: s.id })));
}
