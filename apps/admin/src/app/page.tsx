'use client';

import { useEffect, useState } from 'react';

interface Location {
  id: string;
  name: string;
  type: string;
  city: string;
  address: string;
  latitude: number;
  longitude: number;
  status: string;
}

interface ApiResponse {
  data: Location[];
  meta: {
    total: number;
    page: number;
    limit: number;
  };
}

export default function Home() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchLocations() {
      try {
        const response = await fetch('http://localhost:4000/api/v1/locations');
        if (!response.ok) {
          throw new Error(`HTTP error: ${response.status}`);
        }
        const data: ApiResponse = await response.json();
        setLocations(data.data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur de chargement');
      } finally {
        setLoading(false);
      }
    }

    fetchLocations();
  }, []);

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-tribe-700">TRIBE Admin</h1>
          <p className="text-gray-500 mt-1">Dashboard des Points d'Intérêt</p>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="card p-6">
            <p className="text-sm font-medium text-gray-500">Total POI</p>
            <p className="text-3xl font-bold text-tribe-600">{locations.length}</p>
          </div>
          <div className="card p-6">
            <p className="text-sm font-medium text-gray-500">POI Actifs</p>
            <p className="text-3xl font-bold text-green-600">
              {locations.filter(l => l.status === 'active').length}
            </p>
          </div>
          <div className="card p-6">
            <p className="text-sm font-medium text-gray-500">Types uniques</p>
            <p className="text-3xl font-bold text-blue-600">
              {new Set(locations.map(l => l.type)).size}
            </p>
          </div>
        </div>

        {/* POI List */}
        <div className="card">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800">Liste des POI</h2>
          </div>

          {loading && (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-tribe-600 mx-auto"></div>
              <p className="mt-4 text-gray-500">Chargement des POI...</p>
            </div>
          )}

          {error && (
            <div className="p-6">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-700">Erreur: {error}</p>
                <p className="text-sm text-red-500 mt-1">
                  Assurez-vous que l'API est lancée sur http://localhost:4000
                </p>
              </div>
            </div>
          )}

          {!loading && !error && locations.length === 0 && (
            <div className="p-12 text-center text-gray-500">
              Aucun POI trouvé
            </div>
          )}

          {!loading && !error && locations.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nom
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ville
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Adresse
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Statut
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {locations.map((location) => (
                    <tr key={location.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="font-medium text-gray-900">{location.name}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs rounded-full bg-tribe-100 text-tribe-700">
                          {location.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                        {location.city}
                      </td>
                      <td className="px-6 py-4 text-gray-600 max-w-xs truncate">
                        {location.address}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${
                            location.status === 'active'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {location.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
