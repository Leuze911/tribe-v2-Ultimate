'use client';
import { useEffect, useState } from 'react';
import { api, Stats } from '@/lib/api';
import StatsCard from '@/components/StatsCard';
import { 
  MapPinIcon, 
  ClockIcon, 
  CheckCircleIcon, 
  XCircleIcon 
} from '@heroicons/react/24/outline';

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const data = await api.getStats();
      setStats(data);
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-tribe-600"></div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatsCard
          title="Total POI"
          value={stats?.total || 0}
          icon={<MapPinIcon className="h-8 w-8" />}
          color="blue"
        />
        <StatsCard
          title="En attente"
          value={stats?.pending || 0}
          icon={<ClockIcon className="h-8 w-8" />}
          color="yellow"
        />
        <StatsCard
          title="Valides"
          value={stats?.validated || 0}
          icon={<CheckCircleIcon className="h-8 w-8" />}
          color="green"
        />
        <StatsCard
          title="Rejetes"
          value={stats?.rejected || 0}
          icon={<XCircleIcon className="h-8 w-8" />}
          color="red"
        />
      </div>

      <div className="card p-6">
        <h2 className="text-lg font-semibold mb-4">Bienvenue sur TRIBE Admin</h2>
        <p className="text-gray-600">
          Gerez les Points dInteret collectes par les utilisateurs. 
          Validez ou rejetez les soumissions depuis la page Locations.
        </p>
      </div>
    </div>
  );
}
