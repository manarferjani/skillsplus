import React from 'react';

export default function UserProfile() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Profil de l'utilisateur</h1>

      {/* Section Détails */}
      <section id="details" className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Détails</h2>
        <p>Informations personnelles, adresse, date de naissance, etc.</p>
      </section>

      {/* Section Badges */}
      <section id="badges" className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Badges</h2>
        <ul className="list-disc pl-5">
          <li>Badge Gold (React.js)</li>
          <li>Badge Gold (React Native)</li>
          <li>Badge Silver (DevOps)</li>
        </ul>
      </section>

      {/* Section Statistiques */}
      <section id="stats" className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Statistiques</h2>
        <p>Données de tests, taux de réussite, et plus...</p>
      </section>

      {/* Section Progression */}
      <section id="progression" className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Progression</h2>
        <p>Graphiques et statistiques de progression.</p>
      </section>
    </div>
  );
}
