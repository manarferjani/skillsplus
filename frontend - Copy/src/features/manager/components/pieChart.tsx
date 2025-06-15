import React, { useEffect, useState } from 'react'
import { fetchUserStatsLevelInPercentage } from '@/services/users.service'
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7f50', '#a28bfd']

const UserLevelPieChart = () => {
  const [data, setData] = useState<{ name: string; value: number }[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadStats = async () => {
      try {
        const percentages = await fetchUserStatsLevelInPercentage()

        const formattedData = Object.entries(percentages).map(
          ([level, percentage]) => ({
            name: level,
            value: percentage,
          })
        )

        setData(formattedData)
      } catch (error) {
        console.error('Erreur lors du chargement des stats:', error)
      } finally {
        setLoading(false)
      }
    }

    loadStats()
  }, [])

  if (loading) return <p>Chargement des statistiques...</p>

  // Composant personnalisé pour la légende
  const renderLegend = () => (
    <div className='mt-4 flex flex-wrap justify-center gap-4 text-sm'>
      {data.map((entry, index) => (
        <div key={index} className='flex items-center'>
          <span
            className='mr-1 inline-block h-3 w-3 rounded-full'
            style={{ backgroundColor: COLORS[index % COLORS.length] }}
          ></span>
          <span>{`${entry.name}`}</span>
        </div>
      ))}
    </div>
  )

  return (
    <div className='h-96 w-full rounded-2xl bg-white p-4 shadow'>
      <h2 className='mb-4 text-base font-semibold'>
        Distribution of user levels
      </h2>
      <ResponsiveContainer width='100%' height={250}>
        <PieChart>
          <Pie
            data={data}
            cx='50%'
            cy='50%'
            labelLine={false}
            outerRadius={80}
            dataKey='value'
            /*label={({ name, percent }) =>
              `${name} (${(percent * 100).toFixed(0)}%)`
            }*/
          >
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[index % COLORS.length]}
              />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: number) => `${Math.round(value)} %`}
            contentStyle={{
              borderRadius: 8,
              borderColor: '#8884d8',
              background: 'white',
              boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
            }}
          />
        </PieChart>
      </ResponsiveContainer>

      {/* On ajoute notre légende personnalisée ici */}
      {renderLegend()}
    </div>
  )
}

export default UserLevelPieChart
