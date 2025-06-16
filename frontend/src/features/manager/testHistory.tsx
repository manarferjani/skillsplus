import React, { useState, useEffect } from 'react'
import * as Tooltip from '@radix-ui/react-tooltip'
import { useNavigate } from '@tanstack/react-router'
import { TestRecord } from '@/interfaces/testRecords.interface'
import { fetchFormattedTests } from '@/services/test.service'
import { useFloating, offset, shift, flip } from '@floating-ui/react-dom'
import AutoSizeInput from 'react-input-autosize'
import { useAuth } from '@/context/authContext'
import { useAuthStore } from '@/stores/authStore'

export default function TestsHistory() {
  //const token = useRequireAuth()

  //if (!token) return null
  const [testRecords, setTestRecords] = useState<TestRecord[]>([])
  const [collaboratorFilter, setCollaboratorFilter] = useState<string>('')
  const [technologyFilter, setTechnologyFilter] = useState<string>('')
  const [dateFilter, setDateFilter] = useState<string>('all') // 'all', 'month:YYYY-MM', 'year:YYYY'
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  const { user } = useAuth()
    const navigate = useNavigate()
    const token = useAuthStore((state) => state.auth.accessToken)

  useEffect(() => {
    if (!token) {
      navigate({ to: '/sign-in' })
    }
  }, [token, navigate])

  // Récupération des données
  useEffect(() => {
    const getTests = async () => {
      setIsLoading(true)
      setError(null)
      try {
        let allTests: TestRecord[] = []
        if (user?.role === 'collaborator') {
          console.log('Récupération des tests pour collaborateur :', {
            id: user.id,
            email: user.email,
          })
          allTests = await fetchFormattedTests(user.id)
        } else if (user?.role === 'manager' || user?.role === 'admin') {
          console.log('Récupération de tous les tests')
          allTests = await fetchFormattedTests()
        }
        console.log('Tests récupérés :', allTests)
        setTestRecords(allTests)
      } catch (error) {
        console.error('Erreur lors de la récupération des tests :', error)
        setError('Échec du chargement des tests. Veuillez réessayer.')
        setTestRecords([])
      } finally {
        setIsLoading(false)
      }
    }

    if (user) {
      getTests()
    }
  }, [user])

  // Générer les options de mois et années disponibles
  const generateDateOptions = () => {
    const options: { value: string; label: string }[] = [
      { value: 'all', label: 'Toutes les dates' },
    ]

    if (!Array.isArray(testRecords)) return options

    // Extraire toutes les dates uniques
    const uniqueDates = new Set<string>()
    testRecords.forEach((test) => {
      if (test.scheduledDate) {
        const date = new Date(test.scheduledDate)
        const year = date.getFullYear()
        const month = date.getMonth() + 1
        uniqueDates.add(`${year}-${month.toString().padStart(2, '0')}`)
        uniqueDates.add(year.toString())
      }
    })

    // Trier les dates
    const sortedDates = Array.from(uniqueDates).sort((a, b) => {
      if (a.includes('-') && b.includes('-')) {
        return b.localeCompare(a)
      } else if (a.includes('-')) {
        return b.localeCompare(a.split('-')[0])
      } else if (b.includes('-')) {
        return a.localeCompare(b.split('-')[0])
      }
      return b.localeCompare(a)
    })

    // Ajouter les options
    sortedDates.forEach((date) => {
      if (date.includes('-')) {
        const [year, month] = date.split('-')
        const monthName = new Date(
          parseInt(year),
          parseInt(month) - 1,
          1
        ).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
        options.push({
          value: `month:${date}`,
          label: monthName.charAt(0).toUpperCase() + monthName.slice(1),
        })
      } else {
        options.push({
          value: `year:${date}`,
          label: date,
        })
      }
    })

    return options
  }

  // Transformation des données pour l'affichage
  const fullHistory = Array.isArray(testRecords)
    ? testRecords
        .flatMap((test, index) => {
          console.log(`Test ${index} :`, test)
          if (!test?.participations || !Array.isArray(test.participations)) {
            console.warn(
              `Test ${test?.id || index} n'a pas de participations valides`
            )
            return []
          }
          return test.participations.map((participation) => {
            const timeSpent = participation.timeSpent ?? 0
            return {
              id: `${participation.collaborateurEmail}-${test.title}-${test.scheduledDate ?? ''}`,
              testId: test.id,
              name: participation.collaborateurNom || 'Inconnu',
              email: participation.collaborateurEmail || '',
              technology: test.technologie || 'N/A',
              diagnosisColor: getDiagnosisColor(test.technologie || ''),
              test: test.title || 'Sans titre',
              Score_obtenu: participation.totalScore?.toString() || '0',
              Score_max: test.TestMaxScore,
              averageScore: test.averageScore,
              Taux_de_réussite: `${participation.successRate || 0}%`,
              Time_spent: `${Math.floor(timeSpent / 60)}h${(timeSpent % 60).toString().padStart(2, '0')}min`,
              Date: test.scheduledDate
                ? new Date(test.scheduledDate).toLocaleDateString('fr-FR')
                : 'N/A',
              rawDate: test.scheduledDate
                ? new Date(test.scheduledDate)
                : new Date(0),
            }
          })
        })
        .sort((a, b) => b.rawDate.getTime() - a.rawDate.getTime())
    : []

  // Appliquer les filtres
  const filteredData = fullHistory.filter((item) => {
    const matchesCollaborator = item.name
      .toLowerCase()
      .includes(collaboratorFilter.toLowerCase())
    const matchesTechnology = item.technology
      .toLowerCase()
      .includes(technologyFilter.toLowerCase())

    // Filtre de date
    let matchesDate = true
    if (dateFilter !== 'all') {
      const [type, value] = dateFilter.split(':')
      const itemDate = item.rawDate
      const itemYear = itemDate.getFullYear()

      if (type === 'year') {
        matchesDate = itemYear.toString() === value
      } else if (type === 'month') {
        const [year, month] = value.split('-')
        matchesDate =
          itemYear.toString() === year &&
          (itemDate.getMonth() + 1).toString().padStart(2, '0') === month
      }
    }

    return matchesCollaborator && matchesTechnology && matchesDate
  })

  // Grouper les données par technologie
  const groupedData = filteredData.reduce<Record<string, typeof filteredData>>(
    (groups, item) => {
      const key = item.technology
      if (!groups[key]) {
        groups[key] = []
      }
      groups[key].push(item)
      return groups
    },
    {}
  )

  const groupKeys = Object.keys(groupedData)

  function getDiagnosisColor(technology: string): string {
    const colors: Record<string, string> = {
      'react.js': 'bg-pink-100 text-pink-600', // #ffc2d1
      angular: 'bg-red-100 text-red-600', // #ff4d6d
      'vue.js': 'bg-teal-100 text-teal-600', // #83c5be
      'express.js': 'bg-orange-100 text-orange-600', // #ff9770
      laravel: 'bg-purple-100 text-purple-600', // #be95c4
      'next.js': 'bg-emerald-100 text-emerald-600',
      flutter: 'bg-blue-100 text-blue-600', // #abc4ff
      django: 'bg-fuchsia-100 text-fuchsia-600', // #ca61c3
      'spring boot': 'bg-rose-100 text-rose-600',
    }

    return colors[technology.toLowerCase()] || 'bg-gray-100 text-gray-600'
  }
  function getTooltipBorderColor(technology: string): string {
    const classes = getDiagnosisColor(technology) // ex: "bg-blue-100 text-blue-600"
    const bgMatch = classes.match(/bg-([a-z]+-\d+)/) // ex: "blue-100"

    if (bgMatch) {
      const color = bgMatch[1] // "blue-100"
      return `border-${color}`
    }

    return 'border-gray-300'
  }

  function getTechnologyTextColor(technology: string): string {
    const classes = getDiagnosisColor(technology)
    const textMatch = classes.match(/text-([a-z]+-\d+)/)

    if (textMatch) {
      return `text-${textMatch[1]}`
    }

    return 'text-gray-600'
  }

  // Gestion de l'état de chargement et des erreurs
  if (isLoading) {
    return (
      <div className='p-8 text-left text-gray-500'>
        Chargement des enregistrements de test...
      </div>
    )
  }

  if (error) {
    return <div className='p-8 text-left text-red-500'>{error}</div>
  }

  const dateOptions = generateDateOptions()

  // Fonction pour calculer l'augmentation des scores moyens par technologie
  const calculateScoreIncrease = () => {
    if (!Array.isArray(testRecords)) {
      console.log('❌ testRecords is not an array')
      return { maxIncrease: 0, technology: '', technologyName: '' }
    }

    // 1. Groupement des tests par technologie
    const techGroups = testRecords.reduce<Record<string, TestRecord[]>>(
      (acc, test) => {
        const tech = test.technologie || 'N/A'
        if (!acc[tech]) acc[tech] = []
        acc[tech].push(test)
        return acc
      },
      {}
    )

    console.log('🗂️ Grouped by technology:', techGroups)

    let maxIncrease = 0
    let maxTech = ''
    let maxTechName = ''

    // 2. Analyse pour chaque technologie
    Object.entries(techGroups).forEach(([tech, tests]) => {
      console.log(`\n🔍 Analyzing technology: ${tech}`)
      console.log(
        '  Tests:',
        tests.map((t) => ({
          scheduledDate: t.scheduledDate,
          averageScore: t.averageScore,
        }))
      )

      // a. Tri des tests du plus récent au plus ancien
      const sortedTests = [...tests].sort(
        (a, b) =>
          new Date(b.scheduledDate || 0).getTime() -
          new Date(a.scheduledDate || 0).getTime()
      )
      console.log(
        '  ➕ Sorted tests:',
        sortedTests.map((t) => ({
          testName: t.title, // ou t.testName selon ta structure
          scheduledDate: t.scheduledDate,
          averageScore: t.averageScore,
        }))
      )

      // b. Filtre des tests avec averageScore valide
      const validTests = sortedTests.filter(
        (t) => t.averageScore !== undefined && t.averageScore !== null
      )

      console.log('  ✅ Valid tests with averageScore:', validTests)

      // c. On a besoin d'au moins 2 tests pour comparer
      if (validTests.length < 2) {
        console.log('  ⚠️ Not enough tests with valid scores for comparison')
        return
      }

      const latest = validTests[0]
      const previous = validTests[1]

      console.log(
        `  📊 Comparing latest (${latest.averageScore}) and previous (${previous.averageScore})`
      )

      // d. Calcul de l'écart absolu
      const increase = Math.abs(latest.averageScore! - previous.averageScore!)
      console.log(`  📈 Score increase for ${tech}: ${increase}`)

      // e. Mise à jour du maximum trouvé
      if (increase > maxIncrease) {
        console.log(`  🏆 New max increase found: ${increase} for ${tech}`)
        maxIncrease = increase
        maxTech = tech
        maxTechName = tech
      }
    })

    console.log('\n✅ Final result:', {
      maxIncrease: Math.round(maxIncrease),
      technology: maxTech,
      technologyName: maxTechName,
    })

    return {
      maxIncrease: Math.round(maxIncrease),
      technology: maxTech,
      technologyName: maxTechName,
    }
  }

  // Utilisation dans le composant
  const { maxIncrease, technology, technologyName } = calculateScoreIncrease()
  const badgeColor = technology
    ? getDiagnosisColor(technology)
    : 'bg-blue-100 text-blue-600'

  const CustomBadgeTooltip = ({
    children,
    technology,
    maxIncrease,
  }: {
    children: React.ReactNode
    technology: string
    maxIncrease: number
  }) => {
    const [open, setOpen] = useState(false)

    const { x, y, strategy, floatingStyles, refs } = useFloating({
      middleware: [offset(8), shift(), flip()],
      placement: 'top',
    })

    const borderColor = getTooltipBorderColor(technology)
    const techTextColor = getTechnologyTextColor(technology)

    return (
      <div
        ref={refs.setReference}
        className='inline-block'
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
      >
        {children}

        {open && (
          <div
            ref={refs.setFloating}
            className={`z-50 w-max max-w-xs rounded-3xl border p-3 text-sm shadow-md ${borderColor}`}
            style={{
              backgroundColor: '#fde2e4',
              position: strategy,
              top: y ?? 0,
              left: x ?? 0,
              ...floatingStyles,
            }}
          >
            <p className='m-0 text-sm text-gray-800'>
              <strong className={`${techTextColor}`}>{technology}</strong> had
              the highest improvement
              <br />
              in average score since the last test:{' '}
              <span className='font-bold text-green-600'>
                +{maxIncrease} pts
              </span>
              .
            </p>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className='p-4'>
      <div className='mb-4 flex items-center justify-between'>
        <h2 className='transform py-4 text-2xl font-bold tracking-wider text-gray-800 transition-transform hover:scale-105'>
          Test History
        </h2>
        <div className='flex items-center space-x-4'>
          {(user?.role === 'admin' || user?.role === 'manager') && (
            <AutoSizeInput
              placeholder='Collaborator...'
              value={collaboratorFilter}
              onChange={(e) => setCollaboratorFilter(e.target.value)}
              className='px-1 py-1 focus:outline-none'
              inputStyle={{
                minWidth: '100px',
                border: 'none',
                outline: 'none',
                boxShadow: 'none',
                backgroundColor: 'transparent',
              }}
            />
          )}
          <AutoSizeInput
            placeholder='Technology...'
            value={technologyFilter}
            onChange={(e) => setTechnologyFilter(e.target.value)}
            className='px-1 py-1 focus:outline-none'
            inputStyle={{
              minWidth: '100px',
              border: 'none',
              outline: 'none',
              boxShadow: 'none',
              backgroundColor: 'transparent',
            }}
          />
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className='border-none bg-background px-2 py-1 text-sm text-gray-700 focus:outline-none'
          >
            {dateOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          {maxIncrease > 0 && (
            <CustomBadgeTooltip
              technology={technology}
              maxIncrease={maxIncrease}
            >
              <span
                className={`rounded-full px-2 py-1 text-sm font-medium ${badgeColor}`}
              >
                {technology} +{maxIncrease} pts
              </span>
            </CustomBadgeTooltip>
          )}
        </div>
      </div>

      {/* Table Header */}
      <div className='mb-2 flex items-center pb-3 text-sm font-semibold uppercase text-gray-500'>
        <div className='w-1/6'>Technology</div>
        <div className='w-1/6 text-left'>Test</div>
        <div className='w-1/6 pl-5 text-left'>Collaborator</div>
        <div className='w-1/6 text-left'>Score Obtained</div>
        <div className='w-1/6 text-left'>Average Score</div>
        <div className='w-1/6 text-left'>Success Rate</div>
        <div className='w-1/7 whitespace-nowrap text-left'>Time Spent</div>
        <div className='w-1/6 pl-20 text-left'>Date</div>
      </div>

      {/* Table Rows */}
      <div className='space-y-2'>
        {groupKeys.length > 0 ? (
          groupKeys.map((technology) =>
            groupedData[technology].map((item, index) => {
              const isFirst = index === 0
              const isLast = index === groupedData[technology].length - 1

              const handleClick = () => {
                navigate({
                  to: '/reports/$testId/$collaboratorId',
                  params: {
                    testId: item.testId,
                    collaboratorId: item.email,
                  },
                })
              }

              return (
                <div
                  key={item.id}
                  onClick={handleClick}
                  className={`flex items-center border border-[#FAFAFA] bg-[#FAFAFA] p-1 py-2 text-[14px] text-gray-700 ${isFirst ? 'rounded-t-3xl' : ''} ${isLast ? 'rounded-b-3xl' : ''} cursor-pointer`}
                >
                  <div className='w-1/6'>
                    {isFirst && (
                      <span
                        className={`inline-block rounded-full px-3 py-1 text-[10px] font-medium ${item.diagnosisColor}`}
                      >
                        {item.technology}
                      </span>
                    )}
                  </div>
                  <div className='w-1/6 text-left text-[12px]'>{item.test}</div>
                  <div className='w-1/6 pl-5 text-left text-blue-600'>
                    {item.name}
                  </div>
                  <div className='w-1/6 text-left'>
                    {item.Score_obtenu}/{item.Score_max}
                  </div>
                  {/* NEW COLUMN: Average Score */}
                  <div className='w-1/6 text-left'>
                    {item.averageScore !== null &&
                    item.averageScore !== undefined
                      ? `${item.averageScore}`
                      : '-'}
                    /{item.Score_max}
                  </div>
                  <div className='w-1/6 text-left'>{item.Taux_de_réussite}</div>
                  <div className='w-1/7 text-left'>{item.Time_spent}</div>
                  <div className='w-1/6 pl-20 text-left'>{item.Date}</div>
                </div>
              )
            })
          )
        ) : (
          <div className='flex items-center justify-center p-8 text-gray-500'>
            {testRecords.length === 0
              ? 'No test records available'
              : 'No matching records found'}
          </div>
        )}
      </div>
    </div>
  )
}
