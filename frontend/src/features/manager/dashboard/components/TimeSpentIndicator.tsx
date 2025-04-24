import React, { useMemo } from 'react';
import { BiSolidUpArrow, BiSolidDownArrow } from 'react-icons/bi';
import { TestRecord } from '../../../../interfaces/testRecords.interface';

interface AverageTestTimeIndicatorProps {
  testRecords: TestRecord[] | null | undefined;
  collaborateurFilter: string;
  technologieFilter: string;
}

const AverageTestTimeIndicator: React.FC<AverageTestTimeIndicatorProps> = ({
  testRecords = [],
  collaborateurFilter,
  technologieFilter,
}) => {
  const safeTestRecords = Array.isArray(testRecords) ? testRecords : [];

  // Filtre et extrait les timeSpent (number[])
  const filteredParticipations: number[] = useMemo(() => {
    return safeTestRecords.flatMap((test) => {
      if (!Array.isArray(test.participations)) return [];
  
      return test.participations
        .filter((participation) => {
          const matchesCollaborateur = participation.collaborateurNom
            .toLowerCase()
            .includes(collaborateurFilter.toLowerCase());
  
          const matchesTechnologie = test.technologie
            .toLowerCase()
            .includes(technologieFilter.toLowerCase());
  
          return matchesCollaborateur && matchesTechnologie;
        })
        .map((participation) => participation.timeSpent)
        .filter((timeSpent): timeSpent is number => typeof timeSpent === 'number'); // ✅ ici
    });
  }, [safeTestRecords, collaborateurFilter, technologieFilter]);
  

  const currentAverage = useMemo(() => {
    if (filteredParticipations.length === 0) return 0;
    const sum = filteredParticipations.reduce((total, time) => total + time, 0);
    return sum / filteredParticipations.length;
  }, [filteredParticipations]);

  const previousAverage = useMemo(() => {
    if (filteredParticipations.length < 2) return 0;
    const previous = filteredParticipations.slice(0, -1);
    const sum = previous.reduce((total, time) => total + time, 0);
    return sum / previous.length;
  }, [filteredParticipations]);

  if (filteredParticipations.length < 2) return null;

  const isIncreased = currentAverage > previousAverage;
  const color = isIncreased ? '#ef4444' : '#10b981'; // Tailwind red-500/green-500
  const Icon = isIncreased ? BiSolidUpArrow : BiSolidDownArrow;

  const percentageChange = previousAverage
    ? Math.abs(((currentAverage - previousAverage) / previousAverage) * 100)
    : 0;

  return (
    <div className="flex items-center">
      <Icon size={16} color={color} />
      <span className={`ml-1 text-sm ${isIncreased ? 'text-red-500' : 'text-green-500'}`}>
        {currentAverage.toFixed(2)} min{' '}
        {previousAverage > 0 && (
          <span className="text-xs opacity-75">
            ({percentageChange.toFixed(0)}% {isIncreased ? '↑' : '↓'})
          </span>
        )}
      </span>
    </div>
  );
};

export default AverageTestTimeIndicator;
