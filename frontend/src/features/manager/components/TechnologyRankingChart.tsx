import { useState, useEffect } from 'react'
import { TestRecord } from '@/interfaces/testRecords.interface'
import clsx from 'clsx'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LabelList,
  Cell,
} from 'recharts'
import { useAuth } from '@/context/authContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import AutoSizeInput from './autoSizeInput'

// 🎨 Palette de couleurs par technologie
const TECHNOLOGY_COLORS: Record<string, string> = {
  'React.js': '#efe9ae',
  Angular: '#ff4d6d',
  'Vue.js': '#83c5be',
  'Express.js': '#ff9770',
  Laravel: '#be95c4',
  'Next.js': '#9ee493',
  NestJS: '#00afb9',
  Flutter: '#abc4ff',
  Django: '#ca61c3',
  'Spring Boot': '#ffb3c1',
}

// ✅ Fonction de couleur dynamique pour avgRate
const getRateColor = (rate: number): string => {
  if (rate > 70) return 'text-red-600'
  if (rate > 50) return 'text-orange-500'
  return 'text-green-600'
}

// ✅ Fonction de couleur pour chaque techno
const getTechnologyColor = (technology: string): string => {
  if (TECHNOLOGY_COLORS[technology]) {
    return TECHNOLOGY_COLORS[technology]
  }
  const colors = Object.values(TECHNOLOGY_COLORS)
  const hash = Array.from(technology).reduce(
    (acc, char) => acc + char.charCodeAt(0),
    0
  )
  return colors[hash % colors.length]
}

// ✅ Tooltip personnalisé
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const rate = payload[0].value
    const technology = label

    return (
      <div className='rounded-3xl border border-blue-500 bg-white px-4 py-2 shadow-md'>
        <p className='mb-1 text-sm font-bold text-blue-600'>{technology}</p>
        <p className='text-sm font-semibold'>
          Average Success Rate:{' '}
          <span className={clsx(getRateColor(rate), 'ml-1')}>{rate}%</span>
        </p>
      </div>
    )
  }
  return null
}

interface TechnologyRankingChartProps {
  testRecords: TestRecord[]
}

function TechnologyRankingChart({ testRecords }: TechnologyRankingChartProps) {
  const [selectedCollaborateur, setSelectedCollaborateur] = useState('')
  const [activeIndex, setActiveIndex] = useState<number | null>(null)
  const { user } = useAuth()

  useEffect(() => {
    setSelectedCollaborateur('')
  }, [testRecords])

  const handleCollaborateurChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setSelectedCollaborateur(e.target.value)
  }

  const aggregateSuccessRates = () => {
    const successRates: Record<string, { totalRate: number; count: number }> =
      {}
    testRecords.forEach((test) => {
      test.participations.forEach((p) => {
        if (
          !selectedCollaborateur ||
          p.collaborateurNom
            .toLowerCase()
            .includes(selectedCollaborateur.toLowerCase())
        ) {
          if (!successRates[test.technologie]) {
            successRates[test.technologie] = { totalRate: 0, count: 0 }
          }
          successRates[test.technologie].totalRate += p.successRate
          successRates[test.technologie].count += 1
        }
      })
    })

    return Object.entries(successRates)
      .map(([tech, data]) => ({
        technologie: tech,
        avgRate: Math.round(data.totalRate / data.count),
      }))
      .sort((a, b) => b.avgRate - a.avgRate)
  }

  const chartData = aggregateSuccessRates()

  return (
    <Card className='col-span-1 h-[320px] !rounded-3xl border-0 shadow-md lg:col-span-5'>
      <CardHeader className='pb-0'>
        <div className='flex items-center justify-between'>
          <CardTitle className='font-bold'>Technology Ranking</CardTitle>
          {(user?.role === 'admin' || user?.role === 'manager') && (
            <AutoSizeInput
              placeholder='collaborator'
              value={selectedCollaborateur}
              onChange={handleCollaborateurChange}
              className='w-40 self-center'
            />
          )}
        </div>
      </CardHeader>
      <CardContent className='h-[270px]'>
        <ResponsiveContainer width='100%' height='100%'>
          <BarChart
            data={chartData}
            layout='vertical'
            margin={{ left: 15, top: 10, bottom: 10 }}
            barGap={10}
          >
            <XAxis type='number' domain={[0, 100]} hide />
            <YAxis
              type='category'
              dataKey='technologie'
              width={80}
              tick={{ fontSize: 13 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} cursor={false} />
            <Bar
              dataKey='avgRate'
              barSize={20}
              radius={[8, 8, 8, 8]}
              onMouseLeave={() => setActiveIndex(null)}
            >
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={getTechnologyColor(entry.technologie)}
                  fillOpacity={
                    activeIndex === null || activeIndex === index ? 1 : 0.3
                  }
                  onMouseEnter={() => setActiveIndex(index)}
                />
              ))}
              <LabelList
                dataKey='avgRate'
                position='right'
                content={({ x, y, width, value }: any) => {
                  const textX = x! + width! + 5 // 5px de marge à droite de la barre
                  const textY = y! + 10 // ajustement vertical

                  const fillColor =
                    value < 50 ? '#dc2626' : value < 70 ? '#f97316' : '#16a34a'

                  return (
                    <text
                      x={textX}
                      y={textY}
                      fontSize={12}
                      fontWeight='bold'
                      fill={fillColor}
                      textAnchor='start'
                    >
                      {value}%
                    </text>
                  )
                }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

export default TechnologyRankingChart
