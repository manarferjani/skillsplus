import React, { useMemo } from 'react'
import { useContext } from 'react'
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
import { useAuth } from '@/context/authContext'

interface Test1Props {
  testRecords: TestRecord[]
  collaborateurFilter: string
  technologieFilter: string
  dateFilter: string
}
// Ajoutez cette interface pour les données du graphique
interface ChartData {
  testId: string
  score: number
  tauxReussite: number
  averageSuccessRate: number
  technologie?: string
  date: string
  TestTitle?: string
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
  const { user } = useAuth()

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

  function getDiagnosisColor(technology: string): string {
    const colors: Record<string, string> = {
      'react.js': 'bg-yellow-100 text-yellow-600', // #ffc2d1
      angular: 'bg-red-100 text-red-600', // #ff4d6d
      'vue.js': 'bg-teal-100 text-teal-600', // #83c5be
      'express.js': 'bg-orange-100 text-orange-600', // #ff9770
      laravel: 'bg-purple-100 text-purple-600', // #be95c4
      'next.js': 'bg-emerald-100 text-emerald-600',
      nestjs: 'bg-cyan-100 text-cyan-600', // #00afb9
      flutter: 'bg-blue-100 text-blue-600', // #abc4ff
      django: 'bg-fuchsia-100 text-fuchsia-600', // #ca61c3
      'spring boot': 'bg-rose-100 text-rose-600',
    }

    return colors[technology.toLowerCase()] || 'bg-gray-100 text-gray-600'
  }

  //la fonction calculateFilteredIncrease
  const calculateFilteredIncrease = (): {
    maxIncrease: number
    technology: string
  } => {
    // Cas où aucun filtre collaborateur n'est appliqué
    if (collaborateurFilter.trim() === '') {
      console.log(
        'Aucun filtre collaborateur - retourne des valeurs par défaut'
      )
      console.groupEnd()
      return { maxIncrease: 0, technology: '' }
    }

    // 1. Trouver tous les tests du collaborateur filtré
    const collaborateurTests = testRecords.filter((test) =>
      test.participations.some((p) =>
        p.collaborateurNom
          .toLowerCase()
          .includes(collaborateurFilter.toLowerCase())
      )
    )

    /*console.log('Tests du collaborateur filtré:', {
      nombreDeTests: collaborateurTests.length,
      tests: collaborateurTests.map((t) => ({
        id: t.id,
        technologie: t.technologie,
        scheduledDate: t.scheduledDate,
        averageScore: t.averageScore,
        participations: t.participations.map((p) => p.collaborateurNom),
      })),
    })*/

    // 2. Grouper par technologie
    const techGroups: Record<string, TestRecord[]> = {}

    collaborateurTests.forEach((test) => {
      if (!test.technologie) {
        console.warn(`Test ${test.id} ignoré: technologie manquante`)
        return
      }
      if (!techGroups[test.technologie]) {
        techGroups[test.technologie] = []
      }
      techGroups[test.technologie].push(test)
    })

    let maxIncrease = 0
    let maxTech = ''

    // 3. Calculer l'augmentation pour chaque technologie
    Object.entries(techGroups).forEach(([tech, tests]) => {
      //console.group(`Calcul pour la technologie: ${tech}`);

      // Trier par date (du plus récent au plus ancien)
      const sortedTests = [...tests].sort(
        (a, b) =>
          new Date(b.scheduledDate || 0).getTime() -
          new Date(a.scheduledDate || 0).getTime()
      )

      // Prendre les 2 derniers tests avec averageScore
      const validTests = sortedTests
        .filter((t) => t.averageScore !== undefined && t.averageScore !== null)
        .slice(0, 2)

      if (validTests.length < 2) {
        return
      }

      const [latest, previous] = validTests
      const increase =
        ((latest.averageScore! - previous.averageScore!) /
          previous.averageScore!) *
        100

      if (increase > maxIncrease) {
        //console.log(`Nouvelle augmentation maximale trouvée: ${increase}% (précédent max: ${maxIncrease}%)`);
        maxIncrease = increase
        maxTech = tech
      } else {
        //console.log(`Augmentation de ${increase}% - inférieure au max actuel (${maxIncrease}%)`);
      }

      console.groupEnd()
    })

    const resultat = {
      maxIncrease: Math.round(maxIncrease),
      technology: maxTech,
    }

    return resultat
  }

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
      const completedTestsThisWeek = getCompletedTestsThisWeek(testRecords)

      const result = completedTestsThisWeek.map((test) => {
        const cleanedTitle = test.title.replace(/^Test\s*/i, '')
        const titleParts = cleanedTitle.split(' ')
        const firstPart = titleParts[0]
        const secondPart = titleParts.slice(1).join(' ')

        const participation = test.participations?.[0]

        return {
          testId: `${firstPart.trim()}\n${secondPart.trim()}`,
          score: participation?.totalScore ?? 0,
          tauxReussite: participation?.successRate ?? 0,
          averageSuccessRate: test.averageSuccessRate,
          technologie: test.technologie,
          date: test.scheduledDate
            ? new Date(test.scheduledDate).toLocaleDateString('fr-FR', {
                day: '2-digit',
                month: 'short',
              })
            : 'N/A',
        }
      })

      console.log(
        '[Graphique] Données sans filtre (semaine actuelle) :',
        result
      )
      return result
    } else {
      const result = rawData
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

      console.log('[Graphique] Données filtrées :', result)
      return result
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
        <div
          className='rounded-lg border bg-white p-4 text-sm shadow-md'
          style={{ borderColor: '#8884d8' }}
        >
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

  const { maxIncrease, technology } = calculateFilteredIncrease()
  const badgeColor = technology
    ? getDiagnosisColor(technology)
    : 'bg-blue-100 text-blue-600'

  // Vérifie si seulement le filtre collaborateur est appliqué
  const onlyCollaboratorFilter =
    collaborateurFilter.trim() !== '' && technologieFilter.trim() === ''

  return (
    <div style={{ display: 'flex', justifyContent: 'center' }}>
      <ResponsiveContainer width='100%' height={200}>
        <BarChart
          data={testData}
          margin={{ top: 20, right: 0, bottom: 2, left: 0 }}
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
                showDetailedInfo={
                  user?.role === 'collaborator' ||
                  (user &&
                    user.role !== 'collaborator' &&
                    collaborateurFilter.trim() !== '')
                }
              />
            }
          />

          <Bar
            yAxisId='left'
            dataKey='averageSuccessRate'
            name='Taux de Réussite Moyen du Test'
            fill='#8f00ff'
            radius={[4, 4, 0, 0]}
          />
          {user &&
            (user.role === 'collaborator' ||
              collaborateurFilter.trim() !== '') && (
              <Bar
                yAxisId='left'
                dataKey='tauxReussite'
                name='Taux de Réussite'
                fill='#1fc0da'
                radius={[4, 4, 0, 0]}
              />
            )}
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
