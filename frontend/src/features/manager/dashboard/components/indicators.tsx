import React, { useMemo } from 'react'
import { BiSolidUpArrow, BiSolidDownArrow } from 'react-icons/bi'
import { TestRecord } from '../../../../interfaces/testRecords.interface'

export interface IndicatorsProps {
  testRecords: TestRecord[]
  collaborateur: string
  technologie: string
}

interface IndicatorCompProps {
  currentValue: number
  previousValue: number
  suffix?: string
  prefix?: string
}

const IndicatorComp: React.FC<IndicatorCompProps> = ({
  currentValue,
  previousValue,
  suffix = '',
  prefix = '',
}) => {
  const formatValue = (value: number) =>
    Number.isFinite(value) ? (value % 1 === 0 ? value.toString() : value.toFixed(2)) : 'N/A'

  const diff = currentValue - previousValue
  const isUp = diff >= 0
  const absDiff = Math.abs(diff)
  const color = isUp ? 'green' : 'red'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ fontSize: '15px', fontWeight: 600, color: '#000' }}>
        {prefix}{formatValue(currentValue)}{suffix}
      </div>
      <div style={{ fontSize: '12px', fontWeight: 400, display: 'flex', alignItems: 'center', color }}>
        {isUp
          ? <BiSolidUpArrow size={10} color={color} />
          : <BiSolidDownArrow size={10} color={color} />
        }
        <span style={{ marginLeft: '4px' }}>
          {prefix}{formatValue(absDiff)}{suffix}
        </span>
      </div>
    </div>
  )
}

const Indicators: React.FC<IndicatorsProps> = ({ testRecords, collaborateur, technologie }) => {
  
  console.log("📊 testRecords dans Indicators :", testRecords);
  const testData = useMemo(() => {
    if (!Array.isArray(testRecords) || testRecords.length === 0) {
      console.log('testRecords est vide ou undefined');
      return [];
    }

    const filteredData = testRecords.flatMap(test => {
      if (!Array.isArray(test.participations)) return [];

      return test.participations.map(part => ({
        date: test.scheduledDate
          ? new Date(test.scheduledDate).toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: 'short',
          })
          : 'N/A',
        collaborateur: part.collaborateurNom ?? 'Inconnu',
        technologie: test.technologie ?? 'Inconnue',
        score: typeof part.totalScore === 'number' ? part.totalScore : 0,
        tauxReussite: typeof part.successRate === 'number' ? part.successRate : 0,
        TestTitle: test.title ?? 'Sans titre',
      }));
    }).filter(item => {
      const collaborateurMatch = collaborateur ? item.collaborateur === collaborateur : true;
      const technologieMatch = technologie ? item.technologie === technologie : true;
      return collaborateurMatch && technologieMatch;
    });

    console.log("Données filtrées :", filteredData); // Log avant le return

    return filteredData;
  }, [testRecords, collaborateur, technologie]);


  // Moyenne du taux de réussite
  const avgTaux = useMemo(() => {
    if (testData.length === 0) return null
    const valid = testData.filter(t => typeof t.tauxReussite === 'number' && !isNaN(t.tauxReussite))
    if (valid.length === 0) return null
    return valid.reduce((acc, t) => acc + t.tauxReussite, 0) / valid.length
  }, [testData])

  const prevAvgTaux = useMemo(() => {
    if (testData.length < 2) return null
    const previous = testData.slice(0, -1).filter(t => typeof t.tauxReussite === 'number' && !isNaN(t.tauxReussite))
    if (previous.length === 0) return null
    return previous.reduce((acc, t) => acc + t.tauxReussite, 0) / previous.length
  }, [testData])

  // Moyenne du score
  const avgScore = useMemo(() => {
    if (testData.length === 0) return null
    const valid = testData.filter(t => typeof t.score === 'number' && !isNaN(t.score))
    if (valid.length === 0) return null
    return valid.reduce((acc, t) => acc + t.score, 0) / valid.length
  }, [testData])

  const prevAvgScore = useMemo(() => {
    if (testData.length < 2) return null
    const previous = testData.slice(0, -1).filter(t => typeof t.score === 'number' && !isNaN(t.score))
    if (previous.length === 0) return null
    return previous.reduce((acc, t) => acc + t.score, 0) / previous.length
  }, [testData])


  return (
    <div className="flex items-center gap-4">
      {avgTaux !== null && prevAvgTaux !== null && avgScore !== null && prevAvgScore !== null ? (
        <>
          <IndicatorComp currentValue={avgTaux} previousValue={prevAvgTaux} suffix="%" />
          <IndicatorComp currentValue={avgScore} previousValue={prevAvgScore} suffix="pts" />
        </>
      ) : (
        <div className="text-gray-500 text-sm italic">
          Aucune donnée disponible pour ces filtres
        </div>
      )}
    </div>
  )

}

export default Indicators
