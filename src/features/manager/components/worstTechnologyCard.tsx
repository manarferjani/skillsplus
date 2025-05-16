import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { MdInfoOutline } from 'react-icons/md';
import { getTechnologyIcon } from '@/utils/getTechnologyIcon';
import AutoSizeInput from './autoSizeInput';
import { useState, useEffect } from 'react';
import { TestRecord } from '@/interfaces/testRecords.interface';

interface WorstTechnologyCardProps {
  testRecords: TestRecord[];
}

const WorstTechnologyCard = ({ testRecords }: WorstTechnologyCardProps) => {
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

  const getWorstTechnology = (name: string) => {
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

    let worst: { technologie: string; avgScore: number; avgRate: number } | null = null;
    let worstRate = Infinity;

    for (const tech in filtered) {
      const { totalScore, totalRate, count } = filtered[tech];
      const avgRate = totalRate / count;
      const avgScore = totalScore / count;

      if (avgRate < worstRate) {
        worstRate = avgRate;
        worst = { technologie: tech, avgScore, avgRate };
      }
    }

    return worst;
  };

  const displayedCollaborateur = selectedCollaborateur || allCollaborateurs[currentIndex] || '';
  const worstTech = getWorstTechnology(displayedCollaborateur);

  return (
    <Card className="!rounded-3xl relative border-0 shadow-md">
      <CardHeader className="pb-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 pb-2">
            <CardTitle className="text-sm font-medium">Worst technology</CardTitle>
            <AutoSizeInput
              placeholder="collaborator"
              value={displayedCollaborateur}
              onChange={(e) => setSelectedCollaborateur(e.target.value)}
            />
          </div>
          <a href="/_authenticated/userProfile#badges" className="absolute top-3 right-3">
            <MdInfoOutline size={20} className="text-gray-500 hover:text-gray-700" />
          </a>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {worstTech ? (
          <>
            <div className="flex items-center gap-2 text-2xl font-bold">
              <span>
                {worstTech.technologie} : {Math.round(worstTech.avgRate)}%
              </span>
              {getTechnologyIcon(worstTech.technologie)}
            </div>
            <p className="text-xs text-muted-foreground">
              Average Score: {Math.round(worstTech.avgScore)} / 100
            </p>
          </>
        ) : (
          <div className="text-2xl font-bold">Aucune donnée</div>
        )}
      </CardContent>
    </Card>
  );
};

export default WorstTechnologyCard;
