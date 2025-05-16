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
  const diff = currentValue - previousValue
  const isUp = diff >= 0
  const absDiff = Math.abs(diff)

  const badgeStyle = isUp
    ? 'bg-green-100 text-green-600'
    : 'bg-red-100 text-red-600'

  const sign = isUp ? '+' : '-'
  const displayValue =
    absDiff % 1 === 0 ? absDiff.toFixed(0) : absDiff.toFixed(1)

  const tooltipColor = isUp ? 'text-green-600' : 'text-red-600'
  const borderColor = isUp ? 'border-green-600' : 'border-red-600'
  const changeType = isUp ? 'increase' : 'decrease'

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
    if (!Array.isArray(testRecords) || testRecords.length === 0) return []

    const filteredData = testRecords
      .flatMap((test) => {
        if (!Array.isArray(test.participations)) return []

        return test.participations.map((part) => ({
          date: test.scheduledDate ?? '',
          collaborateur: part.collaborateurNom ?? 'Inconnu',
          technologie: test.technologie ?? 'Inconnue',
          score: typeof part.totalScore === 'number' ? part.totalScore : 0,
          tauxReussite:
            typeof part.successRate === 'number' ? part.successRate : 0,
        }))
      })
      .filter((item) => {
        const collaborateurMatch = collaborateur
          ? item.collaborateur
              .toLowerCase()
              .includes(collaborateur.toLowerCase())
          : true
        const technologieMatch = technologie
          ? item.technologie.toLowerCase().includes(technologie.toLowerCase())
          : true
        return collaborateurMatch && technologieMatch
      })

    filteredData.sort((a, b) => {
      const dateA = new Date(a.date)
      const dateB = new Date(b.date)
      return dateB.getTime() - dateA.getTime()
    })

    return filteredData
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
            tooltip={`You got a ${(
              latest.tauxReussite - previous.tauxReussite
            ).toFixed(
              1
            )}% ${latest.tauxReussite - previous.tauxReussite >= 0 ? 'increase' : 'decrease'} in success rate vs last test`}
          />
          <BadgeDiff
            currentValue={latest.score}
            previousValue={previous.score}
            suffix='pts'
            tooltip={`You got a ${(latest.score - previous.score).toFixed(
              1
            )}pts ${latest.score - previous.score >= 0 ? 'increase' : 'decrease'} in score vs last test`}
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
