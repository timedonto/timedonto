import { PrismaClient, UserRole, AppointmentStatus } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Iniciando seed do banco de dados...')

  // Limpar dados existentes (opcional)
  console.log('🗑️  Limpando dados existentes...')
  await prisma.appointment.deleteMany()
  await prisma.dentistProcedure.deleteMany()
  await prisma.procedure.deleteMany()
  await prisma.specialty.deleteMany()
  await prisma.patient.deleteMany()
  await prisma.dentist.deleteMany()
  await prisma.user.deleteMany()
  await prisma.clinic.deleteMany()

  // Criar clínica
  console.log('🏥 Criando clínica...')
  const clinic = await prisma.clinic.create({
    data: {
      name: 'Clínica Odontológica Sorriso Perfeito',
      email: 'contato@sorrisoperfeito.com.br',
      phone: '(11) 98765-4321',
      address: 'Rua das Flores, 123 - Centro, São Paulo - SP',
    },
  })

  // Criar usuários
  console.log('👥 Criando usuários...')
  const passwordHash = await bcrypt.hash('senha123', 10)

  const ownerUser = await prisma.user.create({
    data: {
      clinicId: clinic.id,
      name: 'Dr. João Silva',
      email: 'joao@sorrisoperfeito.com.br',
      passwordHash,
      role: UserRole.OWNER,
      isActive: true,
    },
  })

  const dentist1User = await prisma.user.create({
    data: {
      clinicId: clinic.id,
      name: 'Dra. Maria Santos',
      email: 'maria@sorrisoperfeito.com.br',
      passwordHash,
      role: UserRole.DENTIST,
      isActive: true,
    },
  })

  const dentist2User = await prisma.user.create({
    data: {
      clinicId: clinic.id,
      name: 'Dr. Rafael Costa',
      email: 'rafael@sorrisoperfeito.com.br',
      passwordHash,
      role: UserRole.DENTIST,
      isActive: true,
    },
  })

  const receptionistUser = await prisma.user.create({
    data: {
      clinicId: clinic.id,
      name: 'Ana Paula Oliveira',
      email: 'ana@sorrisoperfeito.com.br',
      passwordHash,
      role: UserRole.RECEPTIONIST,
      isActive: true,
    },
  })

  // Criar dentistas
  console.log('🦷 Criando dentistas...')
  const dentist1 = await prisma.dentist.create({
    data: {
      clinicId: clinic.id,
      userId: dentist1User.id,
      cro: 'SP-12345',
      specialty: 'Ortodontia',
      commission: 30.0,
    },
  })

  const dentist2 = await prisma.dentist.create({
    data: {
      clinicId: clinic.id,
      userId: dentist2User.id,
      cro: 'SP-67890',
      specialty: 'Implantodontia',
      commission: 35.0,
    },
  })

  // Criar especialidades
  console.log('📋 Criando especialidades...')
  const orthodontics = await prisma.specialty.create({
    data: {
      clinicId: clinic.id,
      name: 'Ortodontia',
      description: 'Tratamentos ortodônticos e aparelhos',
      isActive: true,
    },
  })

  const implantology = await prisma.specialty.create({
    data: {
      clinicId: clinic.id,
      name: 'Implantodontia',
      description: 'Implantes dentários',
      isActive: true,
    },
  })

  const generalDentistry = await prisma.specialty.create({
    data: {
      clinicId: clinic.id,
      name: 'Clínica Geral',
      description: 'Procedimentos odontológicos gerais',
      isActive: true,
    },
  })

  const aesthetics = await prisma.specialty.create({
    data: {
      clinicId: clinic.id,
      name: 'Estética',
      description: 'Procedimentos estéticos dentários',
      isActive: true,
    },
  })

  // Criar procedimentos
  console.log('💉 Criando procedimentos...')
  const procedure1 = await prisma.procedure.create({
    data: {
      clinicId: clinic.id,
      specialtyId: orthodontics.id,
      name: 'Manutenção de Aparelho',
      description: 'Ajuste mensal do aparelho ortodôntico',
      baseValue: 250.0,
      commissionPercentage: 30.0,
      isActive: true,
    },
  })

  const procedure2 = await prisma.procedure.create({
    data: {
      clinicId: clinic.id,
      specialtyId: implantology.id,
      name: 'Implante Unitário',
      description: 'Instalação de implante dentário unitário',
      baseValue: 2500.0,
      commissionPercentage: 35.0,
      isActive: true,
    },
  })

  const procedure3 = await prisma.procedure.create({
    data: {
      clinicId: clinic.id,
      specialtyId: generalDentistry.id,
      name: 'Limpeza Dental',
      description: 'Profilaxia e limpeza completa',
      baseValue: 150.0,
      commissionPercentage: 25.0,
      isActive: true,
    },
  })

  const procedure4 = await prisma.procedure.create({
    data: {
      clinicId: clinic.id,
      specialtyId: aesthetics.id,
      name: 'Clareamento Dental',
      description: 'Clareamento dental a laser',
      baseValue: 800.0,
      commissionPercentage: 30.0,
      isActive: true,
    },
  })

  const procedure5 = await prisma.procedure.create({
    data: {
      clinicId: clinic.id,
      specialtyId: aesthetics.id,
      name: 'Auriculoterapia',
      description: 'Tratamento de auriculoterapia',
      baseValue: 600.0,
      commissionPercentage: 30.0,
      isActive: true,
    },
  })

  // Associar procedimentos aos dentistas
  console.log('🔗 Associando procedimentos aos dentistas...')
  await prisma.dentistProcedure.createMany({
    data: [
      { dentistId: dentist1.id, procedureId: procedure1.id },
      { dentistId: dentist1.id, procedureId: procedure3.id },
      { dentistId: dentist1.id, procedureId: procedure4.id },
      { dentistId: dentist2.id, procedureId: procedure2.id },
      { dentistId: dentist2.id, procedureId: procedure3.id },
      { dentistId: dentist2.id, procedureId: procedure5.id },
    ],
  })

  // Criar pacientes
  console.log('🧑‍⚕️ Criando pacientes...')
  const patient1 = await prisma.patient.create({
    data: {
      clinicId: clinic.id,
      name: 'Carlos Eduardo Mendes',
      email: 'carlos.mendes@email.com',
      phone: '(11) 99876-5432',
      cpf: '123.456.789-00',
      birthDate: new Date('1985-03-15'),
      address: 'Av. Paulista, 1000 - Bela Vista, São Paulo - SP',
      isActive: true,
    },
  })

  const patient2 = await prisma.patient.create({
    data: {
      clinicId: clinic.id,
      name: 'Fernanda Lima',
      email: 'fernanda.lima@email.com',
      phone: '(11) 98765-1234',
      cpf: '987.654.321-00',
      birthDate: new Date('1990-07-22'),
      address: 'Rua Augusta, 500 - Consolação, São Paulo - SP',
      isActive: true,
    },
  })

  const patient3 = await prisma.patient.create({
    data: {
      clinicId: clinic.id,
      name: 'Roberto Alves',
      email: 'roberto.alves@email.com',
      phone: '(11) 97654-3210',
      cpf: '456.789.123-00',
      birthDate: new Date('1978-11-30'),
      address: 'Rua Oscar Freire, 200 - Jardins, São Paulo - SP',
      isActive: true,
    },
  })

  const patient4 = await prisma.patient.create({
    data: {
      clinicId: clinic.id,
      name: 'Juliana Ferreira',
      email: 'juliana.ferreira@email.com',
      phone: '(11) 96543-2109',
      cpf: '321.654.987-00',
      birthDate: new Date('1995-05-18'),
      address: 'Av. Faria Lima, 1500 - Pinheiros, São Paulo - SP',
      isActive: true,
    },
  })

  // Criar agendamentos
  console.log('📅 Criando agendamentos...')
  const today = new Date()
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  const nextWeek = new Date(today)
  nextWeek.setDate(nextWeek.getDate() + 7)

  await prisma.appointment.create({
    data: {
      clinicId: clinic.id,
      dentistId: dentist1.id,
      patientId: patient1.id,
      date: new Date(today.setHours(14, 0, 0, 0)),
      durationMinutes: 60,
      status: AppointmentStatus.CONFIRMED,
      procedureId: procedure1.id,
      procedureSnapshot: {
        name: procedure1.name,
        baseValue: procedure1.baseValue.toNumber(),
        commissionPercentage: procedure1.commissionPercentage.toNumber(),
      },
      notes: 'Paciente relatou sensibilidade',
    },
  })

  await prisma.appointment.create({
    data: {
      clinicId: clinic.id,
      dentistId: dentist2.id,
      patientId: patient2.id,
      date: new Date(today.setHours(16, 30, 0, 0)),
      durationMinutes: 30,
      status: AppointmentStatus.SCHEDULED,
      procedureId: procedure3.id,
      procedureSnapshot: {
        name: procedure3.name,
        baseValue: procedure3.baseValue.toNumber(),
        commissionPercentage: procedure3.commissionPercentage.toNumber(),
      },
    },
  })

  await prisma.appointment.create({
    data: {
      clinicId: clinic.id,
      dentistId: dentist1.id,
      patientId: patient3.id,
      date: new Date(tomorrow.setHours(10, 0, 0, 0)),
      durationMinutes: 45,
      status: AppointmentStatus.SCHEDULED,
      procedureId: procedure4.id,
      procedureSnapshot: {
        name: procedure4.name,
        baseValue: procedure4.baseValue.toNumber(),
        commissionPercentage: procedure4.commissionPercentage.toNumber(),
      },
      notes: 'Primeira sessão de clareamento',
    },
  })

  await prisma.appointment.create({
    data: {
      clinicId: clinic.id,
      dentistId: dentist2.id,
      patientId: patient4.id,
      date: new Date(nextWeek.setHours(15, 0, 0, 0)),
      durationMinutes: 120,
      status: AppointmentStatus.SCHEDULED,
      procedureId: procedure2.id,
      procedureSnapshot: {
        name: procedure2.name,
        baseValue: procedure2.baseValue.toNumber(),
        commissionPercentage: procedure2.commissionPercentage.toNumber(),
      },
      notes: 'Consulta para avaliação de implante',
    },
  })

  console.log('✅ Seed concluído com sucesso!')
  console.log('\n📊 Resumo:')
  console.log(`- 1 clínica criada`)
  console.log(`- 4 usuários criados (1 owner, 2 dentistas, 1 recepcionista)`)
  console.log(`- 2 dentistas criados`)
  console.log(`- 4 especialidades criadas`)
  console.log(`- 5 procedimentos criados`)
  console.log(`- 4 pacientes criados`)
  console.log(`- 4 agendamentos criados`)
  console.log('\n🔑 Credenciais de acesso:')
  console.log('Email: joao@sorrisoperfeito.com.br')
  console.log('Senha: senha123')
}

main()
  .catch((e) => {
    console.error('❌ Erro ao executar seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
