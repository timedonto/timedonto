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
  await prisma.dentistSpecialty.deleteMany()
  await prisma.specialty.deleteMany()
  // Limpar CIDs - usando cID (com C maiúsculo) pois o modelo é CID
  await (prisma as any).cID.deleteMany().catch(() => {
    // Se não existir, tenta com cid minúsculo
    return (prisma as any).cid?.deleteMany() || Promise.resolve()
  })
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

  // Criar CIDs globais
  console.log('🏷️  Criando CIDs globais...')
  
  const cidsData = [
    { code: 'Z01.2', category: 'Exames / Consultas', description: 'Exame odontológico completo / ação programática' },
    { code: 'Z01', category: 'Exames / Consultas', description: 'Solicitação de exames' },
    { code: 'Z71.2', category: 'Exames / Consultas', description: 'Mostrar / discutir resultados de exames' },
    { code: 'Z46.3', category: 'Próteses', description: 'Colocação ou ajuste de prótese dentária' },
    { code: 'Z75.2', category: 'Exames / Consultas', description: 'Tratamento concluído' },
    { code: 'Z76.1', category: 'Restaurações', description: 'Falha ou fratura de restauração' },
    { code: 'Z76.2', category: 'Procedimentos', description: 'Remoção de sutura' },
    { code: 'Z76', category: 'Exames / Consultas', description: 'Contato com serviços de saúde em outras circunstâncias' },
    { code: 'K02.0', category: 'Cárie Dentária', description: 'Cárie limitada ao esmalte' },
    { code: 'K02.1', category: 'Cárie Dentária', description: 'Cárie da dentina' },
    { code: 'K02.2', category: 'Cárie Dentária', description: 'Cárie do cemento' },
    { code: 'K02.3', category: 'Cárie Dentária', description: 'Cárie dentária estacionária' },
    { code: 'K02.4', category: 'Cárie Dentária', description: 'Odontoclasia' },
    { code: 'K02.8', category: 'Cárie Dentária', description: 'Outras cáries dentárias' },
    { code: 'K02.9', category: 'Cárie Dentária', description: 'Cárie dentária não especificada' },
    { code: 'K04.0', category: 'Polpa Dentária', description: 'Pulpite' },
    { code: 'K04.1', category: 'Polpa Dentária', description: 'Necrose da polpa' },
    { code: 'K04.2', category: 'Polpa Dentária', description: 'Degeneração da polpa' },
    { code: 'K04.3', category: 'Polpa Dentária', description: 'Formação anormal de tecido duro na polpa' },
    { code: 'K04.4', category: 'Periapical', description: 'Periodontite apical aguda de origem pulpar' },
    { code: 'K04.5', category: 'Periapical', description: 'Periodontite apical crônica' },
    { code: 'K04.6', category: 'Periapical', description: 'Abscesso periapical com fístula' },
    { code: 'K04.7', category: 'Periapical', description: 'Abscesso periapical sem fístula' },
    { code: 'K04.8', category: 'Periapical', description: 'Cisto radicular' },
    { code: 'K04.9', category: 'Periapical', description: 'Doenças da polpa e tecidos periapicais não especificadas' },
    { code: 'K05.0', category: 'Periodontal', description: 'Gengivite aguda' },
    { code: 'K05.1', category: 'Periodontal', description: 'Gengivite crônica' },
    { code: 'K05.2', category: 'Periodontal', description: 'Periodontite aguda' },
    { code: 'K05.3', category: 'Periodontal', description: 'Periodontite crônica' },
    { code: 'K05.4', category: 'Periodontal', description: 'Periodontose' },
    { code: 'K05.5', category: 'Periodontal', description: 'Outras doenças periodontais' },
    { code: 'K05.6', category: 'Periodontal', description: 'Doença periodontal não especificada' },
    { code: 'K08.0', category: 'Dentes e Estruturas', description: 'Esfoliação dentária por causas sistêmicas' },
    { code: 'K08.1', category: 'Dentes e Estruturas', description: 'Perda de dentes por acidente, extração ou doença periodontal' },
    { code: 'K08.2', category: 'Dentes e Estruturas', description: 'Atrofia do rebordo alveolar' },
    { code: 'K08.3', category: 'Dentes e Estruturas', description: 'Raiz dentária residual' },
    { code: 'K08.8', category: 'Dentes e Estruturas', description: 'Outros transtornos dos dentes e estruturas de suporte' },
    { code: 'K08.9', category: 'Dentes e Estruturas', description: 'Transtorno não especificado dos dentes e estruturas de suporte' },
    { code: 'K07.0', category: 'Dentofacial', description: 'Anomalias importantes do tamanho da mandíbula' },
    { code: 'K07.1', category: 'Dentofacial', description: 'Anomalias da relação mandíbula-base do crânio' },
    { code: 'K07.2', category: 'Dentofacial', description: 'Anomalias da relação dentária' },
    { code: 'K07.3', category: 'Dentofacial', description: 'Anomalias da posição dentária' },
    { code: 'K07.4', category: 'Dentofacial', description: 'Maloclusão não especificada' },
    { code: 'K07.5', category: 'Dentofacial', description: 'Anomalias dentofaciais funcionais' },
    { code: 'S02.5', category: 'Traumatismo Dentário', description: 'Fratura de dente' },
    { code: 'S03.2', category: 'Traumatismo Dentário', description: 'Luxação dentária' },
    { code: 'K09.0', category: 'Cistos', description: 'Cistos odontogênicos' },
    { code: 'K09.1', category: 'Cistos', description: 'Cistos não odontogênicos da região oral' },
    { code: 'K12.0', category: 'Mucosa Oral', description: 'Estomatite aftosa recorrente' },
    { code: 'K12.1', category: 'Mucosa Oral', description: 'Outras formas de estomatite' },
    { code: 'K12.2', category: 'Mucosa Oral', description: 'Celulite e abscesso da boca' },
    { code: 'K13.0', category: 'Mucosa Oral', description: 'Doenças dos lábios' },
    { code: 'K13.7', category: 'Mucosa Oral', description: 'Outras lesões da mucosa oral' },
  ]

  // Tentar criar CIDs - usar qualquer uma das formas possíveis
  try {
    await (prisma as any).cID.createMany({
      data: cidsData,
      skipDuplicates: true,
    })
  } catch (error) {
    // Se cID não funcionar, tentar cid
    try {
      await (prisma as any).cid.createMany({
        data: cidsData,
        skipDuplicates: true,
      })
    } catch (err) {
      console.error('Erro ao criar CIDs:', err)
      throw err
    }
  }

  // Criar especialidades globais (23 especialidades oficiais)
  console.log('📋 Criando especialidades globais...')
  
  const specialtiesData = [
    { id: 'clzacupuntura001', name: 'Acupuntura', description: 'Acupuntura aplicada à odontologia' },
    { id: 'clzcirurgia002', name: 'Cirurgia e Traumatologia Bucomaxilofacial', description: 'Cirurgias da face, boca e estruturas relacionadas' },
    { id: 'clzdentistica003', name: 'Dentística', description: 'Restaurações e procedimentos estéticos dentários' },
    { id: 'clzdisfuncao004', name: 'Disfunção Temporomandibular e Dor Orofacial', description: 'Tratamento de DTM e dores orofaciais' },
    { id: 'clzendodontia005', name: 'Endodontia', description: 'Tratamento de canal e polpa dentária' },
    { id: 'clzestomatologia006', name: 'Estomatologia', description: 'Diagnóstico e tratamento de doenças da boca' },
    { id: 'clzharmonizacao007', name: 'Harmonização Orofacial', description: 'Procedimentos estéticos faciais' },
    { id: 'clzhomeopatia008', name: 'Homeopatia', description: 'Homeopatia aplicada à odontologia' },
    { id: 'clzimplantodontia009', name: 'Implantodontia', description: 'Implantes dentários e reabilitação oral' },
    { id: 'clzodontogeriatria010', name: 'Odontogeriatria', description: 'Odontologia para idosos' },
    { id: 'clzodontesporte011', name: 'Odontologia do Esporte', description: 'Odontologia aplicada ao esporte' },
    { id: 'clzodontotrabalho012', name: 'Odontologia do Trabalho', description: 'Odontologia ocupacional' },
    { id: 'clzodontolegal013', name: 'Odontologia Legal', description: 'Perícia e medicina legal odontológica' },
    { id: 'clzodontoespeciais014', name: 'Odontologia para Pacientes com Necessidades Especiais', description: 'Atendimento a pacientes com necessidades especiais' },
    { id: 'clzodontopediatria015', name: 'Odontopediatria', description: 'Odontologia infantil' },
    { id: 'clzortodontia016', name: 'Ortodontia', description: 'Correção de posicionamento dentário e facial' },
    { id: 'clzortopedia017', name: 'Ortopedia Funcional dos Maxilares', description: 'Correção de crescimento e desenvolvimento facial' },
    { id: 'clzpatologia018', name: 'Patologia Oral', description: 'Diagnóstico de doenças bucais' },
    { id: 'clzperiodontia019', name: 'Periodontia', description: 'Tratamento de gengivas e estruturas de suporte' },
    { id: 'clzprotesebuco020', name: 'Prótese Bucomaxilofacial', description: 'Próteses faciais e bucais' },
    { id: 'clzprotesedent021', name: 'Prótese Dentária', description: 'Próteses dentárias e reabilitação oral' },
    { id: 'clzradiologia022', name: 'Radiologia Odontológica e Imaginologia', description: 'Exames de imagem odontológicos' },
    { id: 'clzsaudecoletiva023', name: 'Saúde Coletiva', description: 'Odontologia em saúde pública' }
  ]

  const createdSpecialties: any = {}
  
  for (const specialtyData of specialtiesData) {
    const specialty = await prisma.specialty.create({
      data: specialtyData
    })
    createdSpecialties[specialtyData.name] = specialty
  }

  // Get references to commonly used specialties
  const orthodontics = createdSpecialties['Ortodontia']
  const implantology = createdSpecialties['Implantodontia']
  const generalDentistry = createdSpecialties['Dentística'] // Using Dentística as general dentistry
  const aesthetics = createdSpecialties['Harmonização Orofacial'] // Using Harmonização as aesthetics

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
  console.log(`- 58 CIDs globais criados`)
  console.log(`- 23 especialidades globais criadas`)
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
