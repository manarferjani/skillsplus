import React from 'react';
import { Performer } from '@/interfaces/performer.interface'; // adapte le chemin si nécessaire
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface PerformersOfTheWeekProps {
  performers: Performer[];
}

const PerformersOfTheWeek: React.FC<PerformersOfTheWeekProps> = ({ performers }) => {
  console.log(performers);

  return (
    <Card className="!rounded-3xl">
      <CardHeader>
        <CardTitle className="text-lg font-bold">Performers of the Week</CardTitle>
      </CardHeader>
      <CardContent>
        {performers.length === 0 ? (
          <p className="text-muted-foreground">Aucun performer pour le moment.</p>
        ) : (
          <ul className="space-y-2">
            {performers.map((performer, index) => (
              <li key={index} className="flex justify-between items-center border-b pb-1">
                {/* Utilisation de 'collaborateurNom' au lieu de 'nomCollaborateur' */}
                <span>{performer.collaborateurNom}</span>
                <span className="text-sm text-muted-foreground">
                  {performer.technologie} — +{performer.scoreEvolution} pts {/* Assure-toi d'utiliser la bonne propriété pour le score */}
                </span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
};

export default PerformersOfTheWeek;
