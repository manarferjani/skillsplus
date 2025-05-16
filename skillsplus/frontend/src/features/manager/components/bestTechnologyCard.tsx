import { useState, useEffect } from 'react';
import { MdInfoOutline } from 'react-icons/md';
import {
  SiReact,
  SiAngular,
  SiVuedotjs,
  SiFlutter,
  SiNextdotjs,
} from 'react-icons/si';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '@/components/ui/card';
import AutoSizeInput from './autoSizeInput';
import { TestRecord } from '@/interfaces/testRecords.interface';

interface BestTechnologyCardProps {
  testRecords: TestRecord[];
}

const getTechnologyIcon = (tech: string) => {
  switch (tech.toLowerCase()) {
    case 'react':
      return <SiReact size={24} color="#61DAFB" />;
    case 'angular':
      return <SiAngular size={24} color="#DD0031" />;
    case 'vue':
      return <SiVuedotjs size={24} color="#42b883" />;
    case 'flutter':
      return <SiFlutter size={24} color="#02569B" />;
    case 'next':
      return <SiNextdotjs size={24} color="#000000" />;
    default:
      return null;
  }
};

function BestTechnologyCard({ testRecords }: BestTechnologyCardProps) {
  const [selectedCollaborateur, setSelectedCollaborateur] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);

  const allCollaborateurs = Array.from(
    new Set(
      testRecords.flatMap((t) =>
        t.participations.map((p) => p.collaborateurNom)
      )
    )
  );

  useEffect(() => {
    if (!selectedCollaborateur) {
      const interval = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % allCollaborateurs.length);
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [selectedCollaborateur, allCollaborateurs]);

  const getBestTechnologies = (name: string) => {
    const filtered: Record<string, { totalScore: number; totalRate: number; count: number }> = {};

    testRecords.forEach((test) => {
      test.participations.forEach((p) => {
        if (p.collaborateurNom.toLowerCase() === name.toLowerCase()) {
          if (!filtered[test.technologie]) {
            filtered[test.technologie] = { totalScore: 0, totalRate: 0, count: 0 };
          }
          filtered[test.technologie].totalScore += p.totalScore;
          filtered[test.technologie].totalRate += p.successRate;
          filtered[test.technologie].count += 1;
        }
      });
    });

    let bestRate = -Infinity;
    const best: { technologie: string; avgScore: number; avgRate: number }[] = [];

    for (const tech in filtered) {
      const { totalScore, totalRate, count } = filtered[tech];
      const avgRate = totalRate / count;
      const avgScore = totalScore / count;

      if (avgRate > bestRate) {
        bestRate = avgRate;
        best.length = 0;
        best.push({ technologie: tech, avgScore, avgRate });
      } else if (avgRate === bestRate) {
        best.push({ technologie: tech, avgScore, avgRate });
      }
    }

    return best;
  };

  const displayedCollaborateur = selectedCollaborateur || allCollaborateurs[currentIndex] || '';
  const bestTechs = getBestTechnologies(displayedCollaborateur);

  const handleCollaborateurChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedCollaborateur(e.target.value);
  };

  return (
    <div className="w-full">
      <Card className="w-full !rounded-3xl relative border-0 shadow-md">
        <CardHeader className="relative pb-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 pb-2">
              <CardTitle className="text-sm font-medium">
                Best technology
              </CardTitle>
              <AutoSizeInput
                placeholder="collaborator"
                value={selectedCollaborateur || allCollaborateurs[currentIndex] || ''}
                onChange={handleCollaborateurChange}
                className="self-center"
              />
            </div>
            <a href="/_authenticated/userProfile#badges" className="absolute top-3 right-3">
              <MdInfoOutline size={20} className="text-gray-500 hover:text-gray-700" />
            </a>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          
          {bestTechs.length > 0 ? (
            bestTechs.map((tech) => (
              <div key={tech.technologie} className="flex flex-col mb-2">
                <div className="flex items-center gap-2 text-2xl font-bold">
                  <span>
                    {tech.technologie} : {Math.round(tech.avgRate)}%
                  </span>
                  {getTechnologyIcon(tech.technologie)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Average Score: {Math.round(tech.avgScore)} / 100
                </p>
              </div>
            ))
          ) : (
            <div className="text-2xl font-bold">Aucune donnée</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default BestTechnologyCard;
