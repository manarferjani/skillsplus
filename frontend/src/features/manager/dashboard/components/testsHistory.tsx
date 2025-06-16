import React, { useState } from 'react';
import AutoSizeInput from 'react-input-autosize';
import { TestRecord } from '../../../../interfaces/testRecords.interface';

interface testsHistoryTableProps {
  testRecords: TestRecord[];
}

const testsHistoryTable: React.FC<testsHistoryTableProps> = ({ testRecords = [] }) => {
  const [collaboratorFilter, setCollaboratorFilter] = useState<string>('');
  const [technologyFilter, setTechnologyFilter] = useState<string>('');
  
  console.log("TEST RECORDS dans TestsHistory:", testRecords);

  // Vérifie si testRecords est un tableau et applique flatMap uniquement dans ce cas
  const testsHistoryTable = Array.isArray(testRecords)
    ? testRecords.flatMap(test => {
      console.log("Test :", test.title, "Participations:", test.participations);
      return test.participations.map(participation => {
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
        };
      });
    })
    : [];


  // Filtre les données en fonction des inputs
  const filteredData = testsHistoryTable.filter((item) => {
    const matchesCollaborator = item.name.toLowerCase().includes(collaboratorFilter.toLowerCase());
    const matchesTechnology = item.technology.toLowerCase().includes(technologyFilter.toLowerCase());
    return matchesCollaborator && matchesTechnology;
  });

  // Regrouper les tests par technologie
  const groupedData = filteredData.reduce<Record<string, typeof testsHistoryTable>>(
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

  // Fonction utilitaire pour obtenir la couleur en fonction de la technologie
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
      {/* En-tête avec filtres */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-gray-800">Tests history</h2>

        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">

            <AutoSizeInput
              placeholder="collaborator..."
              value={collaboratorFilter}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCollaboratorFilter(e.target.value)}
              className="focus:outline-none px-1 py-1"
              inputStyle={{
                minWidth: '100px',
                border: 'none',
                outline: 'none',
                boxShadow: 'none',
              }}
            />
          </div>

          <div className="flex items-center space-x-2">

            <AutoSizeInput
              placeholder="technology..."
              value={technologyFilter}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTechnologyFilter(e.target.value)}
              className=" focus:outline-none px-1 py-1"
              inputStyle={{
                minWidth: '100px',
                border: 'none',
                outline: 'none',
                boxShadow: 'none',
              }}
            />
          </div>

          <span className="bg-blue-100 text-blue-600 px-2 py-1 rounded-full text-sm font-medium">
            +13%
          </span>
        </div>
      </div>

      {/* En-têtes des colonnes */}
      <div className="flex items-center text-gray-500 text-xs font-semibold uppercase mb-2">
        <div className="w-1/6">Technology</div>
        <div className="w-1/6 text-left">Test</div>
        <div className="w-1/6 text-center">Obtained Score</div>
        <div className="w-1/6 text-center">Success Rate</div>
        <div className="w-1/6 text-center">Time Spent</div>
        <div className="w-1/6 text-center">Date</div>
      </div>


      {/* Affichage des données filtrées */}
      <div className="space-y-2">
        {groupKeys.length > 0 ? (
          groupKeys.map((technology) => {
            const groupItems = groupedData[technology];
            return groupItems.map((item, index) => {
              const isFirst = index === 0;
              const isLast = index === groupItems.length - 1;

              return (
                <div
                  key={item.id}
                  className={`flex items-center p-1 border border-[#FAFAFA] bg-[#FAFAFA] text-[13px] text-gray-700
              ${isFirst ? 'rounded-t-3xl' : ''}
              ${isLast ? 'rounded-b-3xl' : ''}`}
                >
                  <div className="w-1/6">
                    {isFirst && (
                      <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-medium ${item.diagnosisColor}`}>
                        {item.technology}
                      </span>
                    )}
                  </div>
                  <div className="w-1/6 text-left text-[13px]">{item.test}</div>
                  <div className="w-1/6 text-center text-[13px]">{item.Score_obtenu}/{item.Score_max}</div>
                  <div className="w-1/6 text-center text-[13px]">{item.Taux_de_réussite}</div>
                  <div className="w-1/6 text-center text-[13px]">{item.Time_spent}</div>
                  <div className="w-1/6 text-center text-[13px]">{item.Date}</div>
                </div>
              );
            });
          })
        ) : (
          <div className="flex justify-center items-center p-8 text-gray-500">
            No matching records found
          </div>
        )}
      </div>

    </div >
  );
};

export default testsHistoryTable;
