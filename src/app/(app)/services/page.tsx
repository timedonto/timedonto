import { getSpecialtiesAction } from './actions'
import { ServicesClient } from './client'
import { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Gestão de Serviços | Timedonto',
    description: 'Gerencie especialidades e procedimentos.',
}

export default async function ServicesPage() {
    const specialtiesData = await getSpecialtiesAction()
    // Serialize dates to avoid passing Date objects to Client Component
    const specialties = JSON.parse(JSON.stringify(specialtiesData))

    return <ServicesClient specialties={specialties} />
}
