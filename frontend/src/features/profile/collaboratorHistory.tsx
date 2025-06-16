import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { fetchFormattedTests } from '@/services/test.service'; // Ton service d'API
import TestsHistoryTable from '@/features/manager/components/testsHistory'; // Ton composant d'historique
import { TestRecord } from '@/interfaces/testRecords.interface'; // Adapter selon ton projet

export default function CollaboratorHistory() {
  const { userId } = useParams();
  const [testRecords, setTestRecords] = useState<TestRecord[]>([]);

  useEffect(() => {
    const loadTests = async () => {
      try {
        const allTests = await fetchFormattedTests();
        const filtered = allTests.filter((test: { userId: string | undefined; }) => test.userId === userId);
        setTestRecords(filtered);
      } catch (err) {
        console.error("Erreur lors du chargement des tests du collaborateur", err);
      }
    };

    loadTests();
  }, [userId]);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Historique du collaborateur</h1>
      <TestsHistoryTable testRecords={testRecords} />
    </div>
  );
}
