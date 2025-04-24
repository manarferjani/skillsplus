// Test1.tsx
import React, { useMemo } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { TestRecord } from '../../../../interfaces/testRecords.interface';

interface Test1Props {
  testRecords: TestRecord[]
  collaborateurFilter: string
  technologieFilter: string
}

export function Test1({ testRecords, collaborateurFilter, technologieFilter }: Test1Props) {
  const rawData = useMemo(() => {
    const flattened: {
      date: string
      collaborateur: string
      technologie: string
      score: number
      tauxReussite: number
      TestTitle: string
    }[] = []
    if (!Array.isArray(testRecords) || testRecords.length === 0){
      console.log('testRecords est vide ou undefined');
      return [];
    }


    testRecords.forEach((test) => {
      test.participations.forEach((part) => {
        flattened.push({
          date: test.scheduledDate ? new Date(test.scheduledDate).toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: 'short',
          }) : 'N/A',
          collaborateur: part.collaborateurNom,
          technologie: test.technologie,
          score: part.totalScore,
          tauxReussite: part.successRate,
          TestTitle: test.title,
        })
      })
    })

    return flattened
  }, [testRecords])

  // Appliquer les filtres
  const filteredData = useMemo(() => {
    return rawData.filter(item => {
      const collabMatch = item.collaborateur.toLowerCase().includes(collaborateurFilter.toLowerCase())
      const techMatch = item.technologie.toLowerCase().includes(technologieFilter.toLowerCase())
      return collabMatch && techMatch
    })
  }, [rawData, collaborateurFilter, technologieFilter])

  // Limiter à 5 éléments
  const testData = useMemo(() => {
    const limited = filteredData.slice(0, 5)
    return limited.map((item) => {
      const cleanedTitle = item.TestTitle.replace(/^Test\s*/i, '') // retire "Test" au début
      const [titlePart, levelPart] = cleanedTitle.split('Niveau')
      return {
        ...item,
        testId: `${titlePart.trim()}\nNiveau${levelPart?.trim() || ''}`, // multi-ligne
      }
    })
  }, [filteredData])

  const CustomizedTick = (props: any) => {
    const { x, y, payload } = props;
    const lines = payload.value.split('\n');
    const lineHeight = 12;
  
    return (
      <g transform={`translate(${x},${y + 10})`}> {/* +10 pour décaler vers le bas */}
        {lines.map((line: string, index: number) => (
          <text
            key={index}
            x={0}
            y={index * lineHeight}
            dy={0}
            textAnchor="middle"
            fill="#888888"
            fontSize={12}
          >
            {line}
          </text>
        ))}
      </g>
    );
  };
  

  return (
    <div style={{ display: 'flex', justifyContent: 'center' }}>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart
          data={testData}
          margin={{ top: 20, right: 0, bottom: 0, left: 0 }}
          barCategoryGap="20%"
        >
          <CartesianGrid strokeWidth={0.2} vertical={false} />
          <XAxis
            dataKey="testId"
            tickLine={false}
            axisLine={false}
            stroke="#888888"
            fontSize={12}
            tick={<CustomizedTick />}
          />
          <YAxis
            yAxisId="left"
            domain={[0, 100]}
            orientation="left"
            tickLine={false}
            axisLine={false}
            stroke="#888888"
            fontSize={12}
            tickFormatter={(value) => value + '%'}
          />
          <YAxis
            yAxisId="right"
            domain={[0, 100]}
            tickLine={false}
            axisLine={false}
            orientation="right"
            stroke="#888888"
            fontSize={12}
            ticks={[0, 25, 50, 75, 100]}
          />
          <Tooltip
            labelFormatter={(value, payload) => {
              if (payload && payload.length > 0 && payload[0].payload) {
                return payload[0].payload.date
              }
              return value
            }}
          />
          <Bar
            yAxisId="left"
            dataKey="tauxReussite"
            name="Taux de Réussite"
            fill="#8f00ff"
            radius={[4, 4, 0, 0]}
          />
          <Bar
            yAxisId="right"
            dataKey="score"
            name="Score"
            fill="#1fc0da"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
