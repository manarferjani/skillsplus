import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom'; // Importez useLocation
import AutoSizeInput from 'react-input-autosize';
import { TestRecord } from '@/interfaces/testRecords.interface';

interface testsHistoryTableProps {
  testRecords: TestRecord[];
}

const testsHistoryTable: React.FC<testsHistoryTableProps> = ({ testRecords = [] }) => {
  const [collaboratorFilter, setCollaboratorFilter] = useState<string>('');
  const [technologyFilter, setTechnologyFilter] = useState<string>('');
  const location = useLocation(); // Utilisez useLocation pour accéder à l'URL

  // Récupérer le nom du collaborateur depuis l'URL
  const searchParams = new URLSearchParams(location.search);
  const collaboratorNameFromUrl = searchParams.get('name') || '';
  const technologyFromUrl = searchParams.get('technology') || '';

  useEffect(() => {
  setCollaboratorFilter(collaboratorNameFromUrl);
  setTechnologyFilter(technologyFromUrl);
}, [collaboratorNameFromUrl, technologyFromUrl]);

  const fullHistory = Array.isArray(testRecords)
    ? testRecords.flatMap(test =>
        test.participations.map(participation => {
          const timeSpent = participation.timeSpent ?? 0;
          return {
            id: `${participation.collaborateurEmail}-${test.title}-${test.scheduledDate ?? ''}`,
            name: participation.collaborateurNom || 'Inconnu',
            email: participation.collaborateurEmail || '',
            technology: test.technologie,
            diagnosisColor: getDiagnosisColor(test.technologie),
            test: test.title,
            Score_obtenu: participation.totalScore.toString(),
            Score_max: '100',
            Taux_de_réussite: `${participation.successRate}%`,
            Time_spent: `${Math.floor(timeSpent / 60)}h ${timeSpent % 60}min`,
            Date: test.scheduledDate ? new Date(test.scheduledDate).toLocaleDateString() : 'N/A',
            rawDate: test.scheduledDate ? new Date(test.scheduledDate) : new Date(0),
          };
        })
      )
      .sort((a, b) => b.rawDate.getTime() - a.rawDate.getTime())
    : [];

  const filteredData = fullHistory.filter((item) => {
    const matchesCollaborator = item.name.toLowerCase().includes(collaboratorFilter.toLowerCase());
    const matchesTechnology = item.technology.toLowerCase().includes(technologyFilter.toLowerCase());
    return matchesCollaborator && matchesTechnology;
  });
  useEffect(() => {
  console.log("Données filtrées hhhhhhhhh:", filteredData);
}, [filteredData]);

  const visibleData = filteredData;

  const groupedData = visibleData.reduce<Record<string, typeof visibleData>>(
    (groups, item) => {
      const key = item.technology;
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(item);
      return groups;
    },
    {}
  );

  const groupKeys = Object.keys(groupedData);

  function getDiagnosisColor(technology: string): string {
    const colors: Record<string, string> = {
      'react.js': 'bg-green-100 text-green-600',
      'flutter': 'bg-blue-100 text-blue-600',
      'next.js': 'bg-purple-100 text-purple-600',
      'angular': 'bg-red-100 text-red-600',
      'vue.js': 'bg-indigo-100 text-indigo-600',
    };
    return colors[technology.toLowerCase()] || 'bg-gray-100 text-gray-600';
  }

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-gray-800">Tests history</h2>
        <div className="flex items-center space-x-4">
          <AutoSizeInput
            placeholder="collaborator..."
            value={collaboratorFilter}
            onChange={(e) => setCollaboratorFilter(e.target.value)}
            className="focus:outline-none px-1 py-1"
            inputStyle={{
              minWidth: '100px',
              border: 'none',
              outline: 'none',
              boxShadow: 'none',
            }}
          />
          <AutoSizeInput
            placeholder="technology..."
            value={technologyFilter}
            onChange={(e) => setTechnologyFilter(e.target.value)}
            className="focus:outline-none px-1 py-1"
            inputStyle={{
              minWidth: '100px',
              border: 'none',
              outline: 'none',
              boxShadow: 'none',
            }}
          />
          <span className="bg-blue-100 text-blue-600 px-2 py-1 rounded-full text-sm font-medium">+13%</span>
        </div>
      </div>

      {/* Table Header */}
      <div className="flex items-center text-gray-500 text-xs font-semibold uppercase mb-2">
        <div className="w-1/6">Technology</div>
        <div className="w-1/6 text-left">Test</div>
        <div className="w-1/6 text-left">Collaborator</div>
        <div className="w-1/6 text-center">Obtained Score</div>
        <div className="w-1/6 text-center">Success Rate</div>
        <div className="w-1/6 text-center">Date</div>
      </div>

      {/* Table Rows */}
      <div className="space-y-2">
        {groupKeys.length > 0 ? (
          groupKeys.map((technology) =>
            groupedData[technology].map((item, index) => {
              const isFirst = index === 0;
              const isLast = index === groupedData[technology].length - 1;

              return (
                <div
                  key={item.id}
                  className={`flex items-center p-1 border border-[#FAFAFA] bg-[#FAFAFA] text-[13px] text-gray-700
                    ${isFirst ? 'rounded-t-3xl' : ''} ${isLast ? 'rounded-b-3xl' : ''}`}
                >
                  <div className="w-1/6">
                    {isFirst && (
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-[10px] font-medium ${item.diagnosisColor}`}
                      >
                        {item.technology}
                      </span>
                    )}
                  </div>
                  <div className="w-1/6 text-left">{item.test}</div>
                  <div className="w-1/6 text-left">{item.name}</div>
                  <div className="w-1/6 text-center">
                    {item.Score_obtenu}/{item.Score_max}
                  </div>
                  <div className="w-1/6 text-center">{item.Taux_de_réussite}</div>
                  <div className="w-1/6 text-center">{item.Date}</div>
                </div>
              );
            })
          )
        ) : (
          <div className="flex justify-center items-center p-8 text-gray-500">
            No matching records found
          </div>
        )}
      </div>
    </div>
  );
};

export default testsHistoryTable;
