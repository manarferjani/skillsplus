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

// 🎨 Palette de couleurs par technologie
const TECHNOLOGY_COLORS: Record<string, string> = {
  'React.js': '#ffc2d1',
  'Angular': '#ff4d6d',
  'Vue.js': '#83c5be',
  'Express.js': '#ff9770',
  'Laravel': '#be95c4',
  'Next.js': '#abc4ff',
  'NestJS': '#00afb9',
  'Flutter': '#abc4ff',
  'Django': '#f7edf0',
  'Spring Boot': '#ffb700',
};

// Fonction de couleur basée sur le nom de la technologie
const getTechnologyColor = (technology: string): string => {
  if (TECHNOLOGY_COLORS[technology]) {
    return TECHNOLOGY_COLORS[technology];
  }
  const colors = Object.values(TECHNOLOGY_COLORS);
  const hash = Array.from(technology).reduce(
    (acc, char) => acc + char.charCodeAt(0),
    0
  );
  return colors[hash % colors.length];
};

interface TechnologyRankingChartProps {
  testRecords: TestRecord[];
}

function TechnologyRankingChart({ testRecords }: TechnologyRankingChartProps) {
  const [selectedCollaborateur, setSelectedCollaborateur] = useState('');
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

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
      .sort((a, b) => b.avgRate - a.avgRate)[0];

    return bestCollaborateur ? bestCollaborateur.collaborateurNom : '';
  };

  useEffect(() => {
    // Ne sélectionne pas un collaborateur spécifique au début, donc vide
    setSelectedCollaborateur('');
  }, [testRecords]);

  const handleCollaborateurChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedCollaborateur(e.target.value);
  };

  const aggregateSuccessRates = () => {
    const successRates: Record<string, { totalRate: number; count: number }> = {};
    testRecords.forEach((test) => {
      test.participations.forEach((p) => {
        // Si aucun collaborateur n'est sélectionné, ne pas filtrer par collaborateur
        if (!selectedCollaborateur || p.collaborateurNom.toLowerCase().includes(selectedCollaborateur.toLowerCase())) {
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
    <Card className="col-span-1 h-[320px] !rounded-3xl border-0 shadow-md lg:col-span-5">
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
      <CardContent className="h-[270px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} layout="vertical" margin={{ left: 15, top: 10, bottom: 10 }} barGap={10}>
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
                  fill={getTechnologyColor(entry.technologie)}
                  fillOpacity={activeIndex === null || activeIndex === index ? 1 : 0.3}
                  onMouseEnter={() => setActiveIndex(index)}
                />
              ))}
              <LabelList dataKey="avgRate" position="right" style={{ fontSize: 13 }} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

export default TechnologyRankingChart;
