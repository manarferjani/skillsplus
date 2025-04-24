import React from 'react';
import { MdInfoOutline } from 'react-icons/md';
import { Link } from '@tanstack/react-router';

export default function ProfileCard() {
  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
      {/* Sous-carte 1 : Infos principales */}
      <div className="relative rounded-3xl h-32 bg-purple-50 p-4 w-40 border border-purple-200">
        {/* ... autres éléments ... */}
        <div className="absolute top-2 right-2">
          <Link to="/_authenticated/userProfile/#details">
            <MdInfoOutline className="text-gray-500 hover:text-gray-700" />
          </Link>
        </div>
      </div>

      {/* Sous-carte 2 : Badges */}
      <div className="relative rounded-3xl h-32 bg-green-50 p-4 w-40 border border-green-200">
        <div className="absolute top-2 right-2">
          <Link to="/_authenticated/userProfile/#badges">
            <MdInfoOutline className="text-gray-500 hover:text-gray-700" />
          </Link>
        </div>
      </div>
      {/* Sous-carte 3 : Statistiques */}
      <div className="relative rounded-3xl h-32 bg-orange-50 p-4 w-40 border border-orange-200">
        <h3 className="mb-2 text-sm font-semibold text-orange-800">Statistiques</h3>
        <p className="text-xs text-gray-700">Tests Passés : 5</p>
        <p className="text-xs text-gray-700">Nombre total : 10</p>
        <p className="text-xs text-gray-700">Taux de réussite moyen : 85%</p>
        <div className="absolute top-2 right-2">
          <Link to="/_authenticated/userProfile/#stats">
            <MdInfoOutline className="text-gray-500 hover:text-gray-700" />
          </Link>
        </div>
      </div>
      {/* Sous-carte 4 : Progression */}
      <div className="relative rounded-3xl h-32 bg-blue-50 p-4 w-40 border border-blue-200">
        <h3 className="mb-2 text-sm font-semibold text-blue-800">Progression</h3>
        <p className="text-xs text-gray-700">Flutter : +25%</p>
        <p className="text-xs text-gray-700">DevOps : -30%</p>
        <p className="text-xs text-gray-700">React.js : +20%</p>
        <div className="absolute top-2 right-2">
          <Link to="/_authenticated/userProfile/#progression">
            <MdInfoOutline className="text-gray-500 hover:text-gray-700" />
          </Link>
        </div>
      </div>
    </div>
  );
}