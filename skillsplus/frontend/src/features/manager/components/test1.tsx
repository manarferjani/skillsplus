import React, { useMemo } from 'react'
import {
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  subYears,
  isWithinInterval,
  subMonths,
} from 'date-fns'
import { TestRecord } from '@/interfaces/testRecords.interface'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

interface Test1Props {
  testRecords: TestRecord[]
  collaborateurFilter: string
  technologieFilter: string
  dateFilter: string
}

// Fonction utilitaire pour récupérer les tests complétés cette semaine
function getCompletedTestsThisWeek(tests: TestRecord[]) {
  const now = new Date()
  const start = startOfWeek(now, { weekStartsOn: 1 })
  const end = endOfWeek(now, { weekStartsOn: 1 })

  return tests.filter(
    (test) =>
      test.status === 'completed' &&
      test.scheduledDate &&
      isWithinInterval(new Date(test.scheduledDate), { start, end })
  )
}

export function Test1({
  testRecords,
  collaborateurFilter,
  technologieFilter,
  dateFilter,
}: Test1Props) {
  // Transformation initiale des données (aplatie les participations)
  const rawData = useMemo(() => {
    const flattened: {
      date: string
      scheduledDateObj: Date | null
      collaborateur: string
      technologie: string
      score: number
      tauxReussite: number
      TestTitle: string
      averageSuccessRate: number
      status: string
    }[] = []

    if (!Array.isArray(testRecords) || testRecords.length === 0) {
      return []
    }

    testRecords.forEach((test) => {
      test.participations.forEach((part) => {
        flattened.push({
          date: test.scheduledDate
            ? new Date(test.scheduledDate).toLocaleDateString('fr-FR', {
                day: '2-digit',
                month: 'short',
              })
            : 'N/A',
          scheduledDateObj: test.scheduledDate
            ? new Date(test.scheduledDate)
            : null,
          collaborateur: part.collaborateurNom,
          status: test.status,
          technologie: test.technologie,
          score: part.totalScore,
          tauxReussite: part.successRate,
          TestTitle: test.title,
          averageSuccessRate: test.averageSuccessRate,
        })
      })
    })

    return flattened
  }, [testRecords])

  // Fonction filtre date (inchangée)
  const filterByDate = (item: { scheduledDateObj: Date | null }) => {
    if (!item.scheduledDateObj) return false
    const date = item.scheduledDateObj
    const currentDate = new Date()

    switch (dateFilter) {
      case 'thisWeek':
        return isWithinInterval(date, {
          start: startOfWeek(currentDate, { weekStartsOn: 1 }),
          end: endOfWeek(currentDate, { weekStartsOn: 1 }),
        })
      case 'thisMonth':
        return isWithinInterval(date, {
          start: startOfMonth(currentDate),
          end: endOfMonth(currentDate),
        })
      case 'lastMonth':
        const lastMonth = subMonths(currentDate, 1)
        return isWithinInterval(date, {
          start: startOfMonth(lastMonth),
          end: endOfMonth(lastMonth),
        })
      default:
        return true
    }
  }

  // Données à afficher dans le graphique
  const testData = useMemo(() => {
    const noFiltersApplied =
      collaborateurFilter.trim() === '' && technologieFilter.trim() === ''

    if (noFiltersApplied) {
      // Récupérer tests complétés cette semaine (sans aplatir les participations)
      const completedTestsThisWeek = getCompletedTestsThisWeek(testRecords)

      // On retourne directement un tableau avec testId et averageSuccessRate
      return completedTestsThisWeek.map((test) => {
        // Construction du testId au format avec retour à la ligne
        const cleanedTitle = test.title.replace(/^Test\s*/i, '')
        const titleParts = cleanedTitle.split(' ')
        const firstPart = titleParts[0]
        const secondPart = titleParts.slice(1).join(' ')
        return {
          testId: `${firstPart.trim()}\n${secondPart.trim()}`,
          score: test.averageScore ?? 0, // si tu as averageScore, sinon averageSuccessRate
          tauxReussite: test.averageSuccessRate,
          averageSuccessRate: test.averageSuccessRate,
          date: test.scheduledDate
            ? new Date(test.scheduledDate).toLocaleDateString('fr-FR', {
                day: '2-digit',
                month: 'short',
              })
            : 'N/A',
        }
      })
    } else {
      // Sinon filtre habituel sur les participations aplaties
      return rawData
        .filter((item) => {
          const collabMatch = item.collaborateur
            .toLowerCase()
            .includes(collaborateurFilter.toLowerCase())
          const techMatch = item.technologie
            .toLowerCase()
            .includes(technologieFilter.toLowerCase())
          const dateMatch = filterByDate(item)

          return collabMatch && techMatch && dateMatch
        })
        .map((item) => {
          const cleanedTitle = item.TestTitle.replace(/^Test\s*/i, '')
          const titleParts = cleanedTitle.split(' ')
          const firstPart = titleParts[0]
          const secondPart = titleParts.slice(1).join(' ')
          return {
            ...item,
            testId: `${firstPart.trim()}\n${secondPart.trim()}`,
          }
        })
    }
  }, [testRecords, rawData, collaborateurFilter, technologieFilter, dateFilter])

  // Tick personnalisé pour l'axe X (inchangé)
  const CustomizedTick = (props: any) => {
    const { x, y, payload } = props
    const lines = payload.value.split('\n')
    const lineHeight = 12

    return (
      <g transform={`translate(${x},${y + 10})`}>
        {lines.map((line: string, index: number) => (
          <text
            key={index}
            x={0}
            y={index * lineHeight}
            dy={0}
            textAnchor='middle'
            fill='#888888'
            fontSize={12}
          >
            {line}
          </text>
        ))}
      </g>
    )
  }

  // Tooltip personnalisé (inchangé)
  const CustomTooltip = ({ active, payload, showDetailedInfo }: any) => {
    if (active && payload && payload.length > 0) {
      const data = payload[0].payload

      const getColorClass = (rate: number) => {
        if (rate < 50) return 'text-red-500'
        if (rate < 70) return 'text-orange-500'
        return 'text-green-600'
      }

      const formatNumber = (num: number) => {
        return Number.isInteger(num) ? num.toString() : num.toFixed(2)
      }

      return (
        <div className='rounded-3xl border border-gray-300 bg-white p-4 text-sm shadow-md'>
          <p className='m-0 font-semibold'>{data.date}</p>
          {showDetailedInfo && (
            <>
              <p className='m-0'>Score : {formatNumber(data.score)}</p>
              <p className='m-0'>
                Success-Rate :{' '}
                <span className={getColorClass(data.tauxReussite)}>
                  {Math.round(data.tauxReussite)}%
                </span>
              </p>
            </>
          )}
          <p className='m-0'>
            avg-Success-Rate :{' '}
            <span className={getColorClass(data.averageSuccessRate)}>
              {Math.round(data.averageSuccessRate)}%
            </span>
          </p>
        </div>
      )
    }
    return null
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'center' }}>
      <ResponsiveContainer width='100%' height={200}>
        <BarChart
          data={testData}
          margin={{ top: 20, right: 0, bottom: 0, left: 0 }}
          barCategoryGap='20%'
        >
          <CartesianGrid strokeWidth={0.2} vertical={false} />
          <XAxis
            dataKey='testId'
            tickLine={false}
            axisLine={false}
            stroke='#888888'
            fontSize={12}
            tick={<CustomizedTick />}
          />
          <YAxis
            yAxisId='left'
            domain={[0, 100]}
            orientation='left'
            tickLine={false}
            axisLine={false}
            stroke='#888888'
            fontSize={12}
            tickFormatter={(value) => value + '%'}
          />
          <Tooltip
            content={
              <CustomTooltip
                showDetailedInfo={collaborateurFilter.trim() !== '' }
              />
            }
          />

          <Bar
            yAxisId='left'
            dataKey='tauxReussite'
            name='Taux de Réussite'
            fill='#8f00ff'
            radius={[4, 4, 0, 0]}
          />
          {collaborateurFilter.trim() !== '' && (
            <Bar
              yAxisId='left'
              dataKey='averageSuccessRate'
              name='Taux de Réussite Moyen du Test'
              fill='#1fc0da'
              radius={[4, 4, 0, 0]}
            />
          )}
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
