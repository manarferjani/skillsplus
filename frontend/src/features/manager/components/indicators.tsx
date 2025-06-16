import React, { useMemo } from 'react'
import { TestRecord } from '@/interfaces/testRecords.interface'

export interface IndicatorsProps {
  testRecords: TestRecord[]
  collaborateur: string
  technologie: string
}

interface BadgeDiffProps {
  currentValue: number
  previousValue: number
  suffix?: string
  tooltip?: string
}

const BadgeDiff: React.FC<BadgeDiffProps> = ({
  currentValue,
  previousValue,
  suffix = '',
}) => {
  // Ajout des logs de débogage
  //console.groupCollapsed(`[BadgeDiff] Calcul des différences (${suffix})`)
  //console.log('currentValue:', currentValue)
  //console.log('previousValue:', previousValue)

  const diff = currentValue - previousValue
  //console.log('Différence brute:', diff)

  const isUp = diff >= 0
  const absDiff = Math.abs(diff)
  //console.log('Différence absolue:', absDiff)

  const badgeStyle = isUp
    ? 'bg-green-100 text-green-600'
    : 'bg-red-100 text-red-600'

  const sign = isUp ? '+' : '-'
  const displayValue =
    absDiff % 1 === 0 ? absDiff.toFixed(0) : absDiff.toFixed(1)
  console.log('Valeur affichée:', `${sign}${displayValue}${suffix}`)

  const tooltipColor = isUp ? 'text-green-600' : 'text-red-600'
  const borderColor = isUp ? 'border-green-600' : 'border-red-600'
  const changeType = isUp ? 'increase' : 'decrease'

  console.groupEnd()

  return (
    <div className='group relative cursor-pointer'>
      <span
        className={`rounded-full px-2 py-1 text-sm font-medium ${badgeStyle}`}
      >
        {sign}
        {displayValue}
        {suffix}
      </span>

      <div
        className={`absolute left-1/2 top-full z-10 mt-2 hidden w-[200px] -translate-x-1/2 rounded-3xl border bg-white p-3 text-sm shadow-md group-hover:block ${borderColor}`}
      >
        <p className='m-0 font-normal leading-snug text-gray-800'>
          You got a{' '}
          <span className={`${tooltipColor} font-medium`}>
            {displayValue}
            {suffix} {changeType}
          </span>
          <br /> in {suffix === '%' ? 'success rate' : 'score'} vs last test
        </p>
      </div>
    </div>
  )
}

const Indicators: React.FC<IndicatorsProps> = ({
  testRecords,
  collaborateur,
  technologie,
}) => {
  const testData = useMemo(() => {
    if (!Array.isArray(testRecords)) {
      console.error("[Indicators] testRecords n'est pas un tableau")
      return []
    }

    if (testRecords.length === 0) {
      return []
    }

    console.groupCollapsed('[Indicators] Transformation des données')

    // 1. Transformation et logging des données
    const filteredData = testRecords.flatMap((test, testIndex) => {
      if (!Array.isArray(test.participations)) {
        console.warn('Pas de tableau participations')
        console.groupEnd()
        return []
      }

      const participations = test.participations.map((part, partIndex) => {
        const data = {
          testId: test.id,
          date: test.scheduledDate ?? 'non-daté',
          collaborateur: part.collaborateurNom ?? 'Inconnu',
          technologie: test.technologie ?? 'Inconnue',
          score: typeof part.totalScore === 'number' ? part.totalScore : 0,
          tauxReussite:
            typeof part.successRate === 'number' ? part.successRate : 0,
          rawData: {
            // Conservation des données brutes pour debug
            totalScore: part.totalScore,
            successRate: part.successRate,
          },
        }

        return data
      })
      return participations
    })

    /*console.log('Résultat après transformation:', {
      totalParticipations: filteredData.length,
      aperçu: filteredData.slice(0, 5).map((d) => ({
        testId: d.testId,
        date: d.date,
        collaborateur: d.collaborateur,
        score: d.score,
        taux: d.tauxReussite,
      })),
    })*/

    // 2. Filtrage
    const filtered = filteredData.filter((item) => {
      const collaborateurMatch = collaborateur
        ? item.collaborateur.toLowerCase().includes(collaborateur.toLowerCase())
        : true

      const technologieMatch = technologie
        ? item.technologie.toLowerCase().includes(technologie.toLowerCase())
        : true

      return collaborateurMatch && technologieMatch
    })

    /*console.log('Après filtrage:', {
      participationsRestantes: filtered.length,
      filtresAppliqués: {
        collaborateur: collaborateur || 'aucun',
        technologie: technologie || 'aucun',
      },
    })*/

    // 3. Tri par date (du plus récent au plus ancien)
    filtered.sort((a, b) => {
      const dateA = a.date ? new Date(a.date).getTime() : 0
      const dateB = b.date ? new Date(b.date).getTime() : 0

      return dateB - dateA // Ordre décroissant
    })
      // NOUVEAU LOG: Dernier test après tri
  if (filtered.length > 0) {
    console.log('Dernier test après tri:', {
      date: filtered[0].date,
      collaborateur: filtered[0].collaborateur,
      technologie: filtered[0].technologie,
      score: filtered[0].score,
      tauxReussite: filtered[0].tauxReussite,
      rawScore: filtered[0].rawData.totalScore,
      rawTaux: filtered[0].rawData.successRate
    });
  } else {
    console.log('Aucun test disponible après filtrage');
  }

  console.groupEnd();

    return filtered
  }, [testRecords, collaborateur, technologie])

  const latest = testData[0]
  const previous = testData[1]

  const hasEnoughData = !!latest && !!previous

  return (
    <div className='flex items-center gap-4'>
      {hasEnoughData ? (
        <>
          <BadgeDiff
            currentValue={latest.tauxReussite}
            previousValue={previous.tauxReussite}
            suffix='%'
          />
          <BadgeDiff
            currentValue={latest.score}
            previousValue={previous.score}
            suffix='pts'
          />
        </>
      ) : (
        <div className='text-sm italic text-gray-500'>
          Pas assez de données pour les indicateurs.
        </div>
      )}
    </div>
  )
}

export default Indicators
