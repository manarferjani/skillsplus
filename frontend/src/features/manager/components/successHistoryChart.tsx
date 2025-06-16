import React, { useEffect, useState } from 'react'
import { format } from 'date-fns'
import {
  getSuccessHistory,
  getAllCollaborators,
} from '@/services/collaborator.service'
import TechnologyService from '@/services/technology.service'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { useAuth } from '@/context/authContext'
import AutoSizeInput from '@/features/manager/components/autoSizeInput'

const SuccessHistoryChart = () => {
  const [collaboratorFilter, setCollaboratorFilter] = useState('')
  const [technologyFilter, setTechnologyFilter] = useState('')
  const [data, setData] = useState<any[]>([])
  const { user } = useAuth()

  const [collaborators, setCollaborators] = useState<any[]>([])
  const [technologies, setTechnologies] = useState<any[]>([])

  // ⬇️ Pré-remplir le filtre collaborateur si l'utilisateur est un collaborateur
  useEffect(() => {
    if (user && user.role === 'collaborator') {
      setCollaboratorFilter(`${user.name}`)
    }
  }, [user])

  // ⬇️ Charger tous les collaborateurs et technos une seule fois
  useEffect(() => {
    const fetchAll = async () => {
      try {
        const collabs = await getAllCollaborators()
        const techs = await TechnologyService.getAllTechnologies()
        setCollaborators(collabs)
        setTechnologies(techs)
      } catch (err) {
        console.error('Erreur de chargement :', err)
      }
    }
    fetchAll()
  }, [])

  // ⬇️ Chaque fois que le filtre change, on cherche les IDs correspondants
  useEffect(() => {
    const fetchSuccessHistory = async () => {
      // Ne pas lancer la recherche si l'un des filtres est vide
      if (!collaboratorFilter.trim() || !technologyFilter.trim()) {
        setData([])
        return
      }

      const collab = collaborators.find(
        (c) =>
          c.name &&
          collaboratorFilter &&
          c.name.toLowerCase().trim() ===
            collaboratorFilter.toLowerCase().trim()
      )

      const tech = technologies.find(
        (t) =>
          t.name &&
          technologyFilter &&
          t.name.toLowerCase() === technologyFilter.toLowerCase()
      )

      if (collab && tech) {
        try {
          const result = await getSuccessHistory(collab._id, tech._id)

          const formattedResult = result.map((item) => ({
            ...item,
            successRate: item.successRate / 100,
            date: format(new Date(item.date), 'd MMM'),
          }))
          setData(formattedResult)
        } catch (err) {
          console.error("Erreur lors de la récupération de l'historique :", err)
          setData([])
        }
      } else {
        setData([])
      }
    }

    fetchSuccessHistory()
  }, [collaboratorFilter, technologyFilter, collaborators, technologies])

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className='rounded-3xl border border-gray-200 bg-white px-4 py-2 text-sm shadow-lg'>
          <p className='font-semibold text-gray-800'>{label}</p>
          <p className='text-sm'>
            <span className='font-semibold' style={{ color: '#8884d8' }}>
              Taux de réussite :
            </span>{' '}
            <span className='text-gray-700'>
              {Math.round(payload[0].value * 100)}%
            </span>
          </p>
        </div>
      )
    }

    return null
  }

  const canSeeCollaboratorFilter =
    user && (user.role === 'admin' || user.role === 'manager')

  return (
    <div
      className='w-full rounded-3xl bg-white p-4 shadow-md'
      style={{ height: 350 }}
    >
      <div className='mb-4 ml-4 mr-4 mt-4 flex items-center justify-between'>
        <h2 className='text-lg font-semibold'>Évolution du taux de réussite</h2>
        <div className='flex items-center space-x-4'>
          {canSeeCollaboratorFilter && (
            <AutoSizeInput
              placeholder='collaborator...'
              value={collaboratorFilter}
              onChange={(e) => setCollaboratorFilter(e.target.value)}
            />
          )}
          <AutoSizeInput
            placeholder='technology...'
            value={technologyFilter}
            onChange={(e) => setTechnologyFilter(e.target.value)}
          />
        </div>
      </div>

      {data.length > 0 ? (
        <ResponsiveContainer width='100%' height={250}>
          <LineChart
            data={data}
            margin={{ top: 30, right: 40, left: 10, bottom: 5 }}
          >
            <XAxis
              dataKey='date'
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 13 }}
            />
            <YAxis
              domain={[0, 1]}
              tickFormatter={(value) =>
                value === 0 ? '' : `${Math.round(value * 100)}%`
              }
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 13 }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type='monotone'
              dataKey='successRate'
              stroke='#8884d8'
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <p className='text-gray-500'>Aucune donnée à afficher.</p>
      )}
    </div>
  )
}

export default SuccessHistoryChart