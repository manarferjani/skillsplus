import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TestRecord } from '@/interfaces/testRecords.interface';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LabelList,
  Cell,
} from 'recharts';
import AutoSizeInput from './autoSizeInput';

interface TechnologyRankingChartProps {
  testRecords: TestRecord[];
}

function TechnologyRankingChart({ testRecords }: TechnologyRankingChartProps) {
  const [selectedCollaborateur, setSelectedCollaborateur] = useState('');
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  // Cette fonction va déterminer quel est le collaborateur ayant les meilleurs résultats
  const getBestCollaborateur = () => {
    const successRates: Record<string, { totalRate: number; count: number }> = {};

    testRecords.forEach((test) => {
      test.participations.forEach((p) => {
        if (!successRates[p.collaborateurNom]) {
          successRates[p.collaborateurNom] = { totalRate: 0, count: 0 };
        }
        successRates[p.collaborateurNom].totalRate += p.successRate;
        successRates[p.collaborateurNom].count += 1;
      });
    });

    const bestCollaborateur = Object.entries(successRates)
      .map(([name, data]) => ({
        collaborateurNom: name,
        avgRate: Math.round(data.totalRate / data.count),
      }))
      .sort((a, b) => b.avgRate - a.avgRate)[0]; // Le collaborateur avec le meilleur score

    return bestCollaborateur ? bestCollaborateur.collaborateurNom : '';
  };

  useEffect(() => {
    // Initialiser le collaborateur avec les meilleurs résultats au premier rendu
    const bestCollaborateur = getBestCollaborateur();
    setSelectedCollaborateur(bestCollaborateur);
  }, [testRecords]); // Cette dépendance assure que l'on met à jour si les `testRecords` changent

  const handleCollaborateurChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedCollaborateur(e.target.value);
  };

  const aggregateSuccessRates = () => {
    const successRates: Record<string, { totalRate: number; count: number }> = {};

    testRecords.forEach((test) => {
      test.participations.forEach((p) => {
        if (p.collaborateurNom.toLowerCase().includes(selectedCollaborateur.toLowerCase())) {
          if (!successRates[test.technologie]) {
            successRates[test.technologie] = { totalRate: 0, count: 0 };
          }
          successRates[test.technologie].totalRate += p.successRate;
          successRates[test.technologie].count += 1;
        }
      });
    });

    return Object.entries(successRates)
      .map(([tech, data]) => ({
        technologie: tech,
        avgRate: Math.round(data.totalRate / data.count),
      }))
      .sort((a, b) => b.avgRate - a.avgRate);
  };

  const chartData = aggregateSuccessRates();

  return (
    <Card className="w-full !rounded-3xl">
      <CardHeader className="pb-0">
        <div className="flex items-center justify-between">
          <CardTitle className="font-bold">Technology Ranking</CardTitle>
          <AutoSizeInput
            placeholder="collaborator"
            value={selectedCollaborateur}
            onChange={handleCollaborateurChange}
            className="self-center w-40"
          />
        </div>
      </CardHeader>
      <CardContent className="h-[230px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} layout="vertical" margin={{ left: 15 }}>
            <XAxis type="number" domain={[0, 100]} hide />
            <YAxis
              type="category"
              dataKey="technologie"
              width={80}
              tick={{ fontSize: 13 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip cursor={false} />
            <Bar
              dataKey="avgRate"
              barSize={20}
              radius={[8, 8, 8, 8]}
              onMouseLeave={() => setActiveIndex(null)}
            >
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill="#3b82f6"
                  fillOpacity={activeIndex === null || activeIndex === index ? 1 : 0.3}
                  onMouseEnter={() => setActiveIndex(index)}
                />
              ))}
              <LabelList dataKey="avgRate" position="right" style={{ fontSize: 10 }} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

export default TechnologyRankingChart;
