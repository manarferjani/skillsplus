import React from 'react'
import { Link } from '@tanstack/react-router'
import { MdInfoOutline } from 'react-icons/md'

export default function ProfileCard() {
  return (
    <div className='grid grid-cols-1 gap-2 sm:grid-cols-2'>
      {/* Sous-carte 1 : Infos principales */}
      <div className='relative h-32 w-40 rounded-3xl border border-purple-200 bg-purple-50 p-4'>
        {/* ... autres éléments ... */}
        <div className='absolute right-2 top-2'>
          <Link
            to='/userProfile'
            hash='details' // Utilisez la prop dédiée au lieu d'inclure # dans le path
            params={{}}
            search={{}}
          >
            <MdInfoOutline className='text-gray-500 hover:text-gray-700' />
          </Link>
        </div>
      </div>

      {/* Sous-carte 2 : Badges */}
      <div className='relative h-32 w-40 rounded-3xl border border-green-200 bg-green-50 p-4'>
        <div className='absolute right-2 top-2'>
        <Link
            to='/userProfile'
            hash='badges' // Utilisez la prop dédiée au lieu d'inclure # dans le path
            params={{}}
            search={{}}
          >
            <MdInfoOutline className='text-gray-500 hover:text-gray-700' />
          </Link>
        </div>
      </div>
      {/* Sous-carte 3 : Statistiques */}
      <div className='relative h-32 w-40 rounded-3xl border border-orange-200 bg-orange-50 p-4'>
        <h3 className='mb-2 text-sm font-semibold text-orange-800'>
          Statistiques
        </h3>
        <p className='text-xs text-gray-700'>Tests Passés : 5</p>
        <p className='text-xs text-gray-700'>Nombre total : 10</p>
        <p className='text-xs text-gray-700'>Taux de réussite moyen : 85%</p>
        <div className='absolute right-2 top-2'>
        <Link
            to='/userProfile'
            hash='stats' // Utilisez la prop dédiée au lieu d'inclure # dans le path
            params={{}}
            search={{}}
          >
            <MdInfoOutline className='text-gray-500 hover:text-gray-700' />
          </Link>
        </div>
      </div>
      {/* Sous-carte 4 : Progression */}
      <div className='relative h-32 w-40 rounded-3xl border border-blue-200 bg-blue-50 p-4'>
        <h3 className='mb-2 text-sm font-semibold text-blue-800'>
          Progression
        </h3>
        <p className='text-xs text-gray-700'>Flutter : +25%</p>
        <p className='text-xs text-gray-700'>DevOps : -30%</p>
        <p className='text-xs text-gray-700'>React.js : +20%</p>
        <div className='absolute right-2 top-2'>
        <Link
            to='/userProfile'
            hash='stats' // Utilisez la prop dédiée au lieu d'inclure # dans le path
            params={{}}
            search={{}}
          >
            <MdInfoOutline className='text-gray-500 hover:text-gray-700' />
          </Link>
        </div>
      </div>
    </div>
  )
}
