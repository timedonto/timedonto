import { prisma } from '@/lib/database';
import type { CreateRecordData, UpdateRecordData, ListRecordsFilters } from '../domain/record.schema';

export class RecordRepository {
  /**
   * Find many records with optional filters
   */
  async findMany(clinicId: string, filters?: ListRecordsFilters) {
    const where: any = { clinicId }
    
    if (filters?.patientId) {
      where.patientId = filters.patientId
    }
    if (filters?.dentistId) {
      where.dentistId = filters.dentistId
    }

    return prisma.record.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        patient: true,
        dentist: {
          include: {
            user: true
          }
        },
        appointment: true
      }
    })
  }

  /**
   * Find record by ID
   */
  async findById(id: string, clinicId: string) {
    return await prisma.record.findFirst({
      where: {
        id,
        clinicId,
      },
      include: {
        patient: true,
        dentist: {
          include: {
            user: true
          }
        },
        appointment: true
      }
    });
  }

  /**
   * Create a new record
   */
  async create(clinicId: string, data: CreateRecordData) {
    return await prisma.record.create({
      data: {
        clinicId,
        patientId: data.patientId,
        dentistId: data.dentistId,
        appointmentId: data.appointmentId,
        description: data.description,
        procedures: data.procedures ? JSON.stringify(data.procedures) : null,
        odontogram: data.odontogram ? JSON.stringify(data.odontogram) : null,
      },
      include: {
        patient: true,
        dentist: {
          include: {
            user: true
          }
        },
        appointment: true
      }
    });
  }

  /**
   * Update an existing record
   */
  async update(id: string, clinicId: string, data: UpdateRecordData) {
    const updateData: any = {};

    // Only include fields that are provided
    if (data.patientId !== undefined) {
      updateData.patientId = data.patientId;
    }

    if (data.dentistId !== undefined) {
      updateData.dentistId = data.dentistId;
    }

    if (data.appointmentId !== undefined) {
      updateData.appointmentId = data.appointmentId;
    }

    if (data.description !== undefined) {
      updateData.description = data.description;
    }

    if (data.procedures !== undefined) {
      updateData.procedures = data.procedures ? JSON.stringify(data.procedures) : null;
    }

    if (data.odontogram !== undefined) {
      updateData.odontogram = data.odontogram ? JSON.stringify(data.odontogram) : null;
    }

    return await prisma.record.update({
      where: {
        id,
        clinicId,
      },
      data: updateData,
      include: {
        patient: true,
        dentist: {
          include: {
            user: true
          }
        },
        appointment: true
      }
    });
  }
}

// Export a singleton instance
export const recordRepository = new RecordRepository();