import React from 'react';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import { TestRecord } from '../../../../interfaces/testRecords.interface';
import { TimeSpentRadialProps } from '../../../../interfaces/testRecords.interface';



export function TimeSpentRadial({
  testRecords,
  maxTime,
  collaborateurFilter,
  technologieFilter,
}: TimeSpentRadialProps) {
  // Sécuriser testRecords
  const safeTestRecords = Array.isArray(testRecords) ? testRecords : [];

  // Filtrage des participations correspondant aux filtres
  const filteredParticipation = safeTestRecords.flatMap(test =>
    (test.participations || [])
      .filter(p =>
        p.collaborateurNom.toLowerCase().includes(collaborateurFilter.toLowerCase()) &&
        test.technologie.toLowerCase().includes(technologieFilter.toLowerCase())
      )
      .map(p => ({ timeSpent: p.timeSpent ?? 0 }))
  );

  // On récupère le premier timeSpent correspondant, ou 0 si aucune participation
  const timeSpent = filteredParticipation.length > 0 ? filteredParticipation[0].timeSpent : 0;

  const percentage = maxTime > 0 ? (timeSpent / maxTime) * 100 : 0;

  return (
    <div style={{ width: 200 }}>
      <div style={{ width: 180, height: 180, margin: '0 auto' }}>
        <CircularProgressbar
          value={percentage}
          text={`${timeSpent} min`}
          styles={buildStyles({
            textSize: '16px',
            pathColor: '#8f00ff',
            textColor: '#333',
            trailColor: '#eee',
          })}
        />
      </div>
    </div>
  );
}
