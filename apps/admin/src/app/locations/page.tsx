'use client';
import { useEffect, useState, useCallback } from 'react';
import { api, Location, PaginatedResponse } from '@/lib/api';
import LocationCard from '@/components/LocationCard';
import Pagination from '@/components/Pagination';
import ValidateModal from '@/components/ValidateModal';

const CATEGORIES = [
  { value: '', label: 'Toutes categories' },
  { value: 'restaurant', label: 'Restaurant' },
  { value: 'shop', label: 'Commerce' },
  { value: 'service', label: 'Service' },
  { value: 'health', label: 'Sante' },
  { value: 'education', label: 'Education' },
  { value: 'transport', label: 'Transport' },
  { value: 'tourism', label: 'Tourisme' },
  { value: 'culture', label: 'Culture' },
  { value: 'sport', label: 'Sport' },
  { value: 'other', label: 'Autre' },
];

const STATUSES = [
  { value: '', label: 'Tous statuts' },
  { value: 'pending', label: 'En attente' },
  { value: 'validated', label: 'Valide' },
  { value: 'rejected', label: 'Rejete' },
];

export default function LocationsPage() {
  const [data, setData] = useState<PaginatedResponse<Location> | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [category, setCategory] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [modalAction, setModalAction] = useState<'validate' | 'reject' | null>(null);

  const loadLocations = useCallback(async () => {
    setLoading(true);
    try {
      const result = await api.getLocations({
        page,
        limit: 12,
        status: status || undefined,
        category: category || undefined,
      });
      setData(result);
    } catch (error) {
      console.error('Failed to load locations:', error);
    } finally {
      setLoading(false);
    }
  }, [page, status, category]);

  useEffect(() => {
    loadLocations();
  }, [loadLocations]);

  const handleValidate = (location: Location) => {
    setSelectedLocation(location);
    setModalAction('validate');
  };

  const handleReject = (location: Location) => {
    setSelectedLocation(location);
    setModalAction('reject');
  };

  const handleModalConfirm = async (reason?: string, points?: number) => {
    if (!selectedLocation || !modalAction) return;

    try {
      await api.validateLocation(
        selectedLocation.id,
        modalAction,
        reason,
        points
      );
      loadLocations();
    } catch (error) {
      console.error('Failed to validate:', error);
    } finally {
      setSelectedLocation(null);
      setModalAction(null);
    }
  };

  const handleModalClose = () => {
    setSelectedLocation(null);
    setModalAction(null);
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Locations</h1>

      {/* Filters */}
      <div className="card p-4 mb-6">
        <div className="flex flex-wrap gap-4">
          <select
            value={status}
            onChange={(e) => { setStatus(e.target.value); setPage(1); }}
            className="input w-48"
          >
            {STATUSES.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>

          <select
            value={category}
            onChange={(e) => { setCategory(e.target.value); setPage(1); }}
            className="input w-48"
          >
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>

          <button
            onClick={() => { setStatus(''); setCategory(''); setPage(1); }}
            className="btn btn-secondary"
          >
            Reinitialiser
          </button>
        </div>
      </div>

      {/* Results */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-tribe-600"></div>
        </div>
      ) : data && data.data.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
            {data.data.map((location) => (
              <LocationCard
                key={location.id}
                location={location}
                onValidate={() => handleValidate(location)}
                onReject={() => handleReject(location)}
              />
            ))}
          </div>

          <Pagination
            currentPage={data.page}
            totalPages={data.totalPages}
            onPageChange={setPage}
          />
        </>
      ) : (
        <div className="card p-12 text-center">
          <p className="text-gray-500">Aucune location trouvee</p>
        </div>
      )}

      {/* Modal */}
      {selectedLocation && modalAction && (
        <ValidateModal
          location={selectedLocation}
          action={modalAction}
          onConfirm={handleModalConfirm}
          onClose={handleModalClose}
        />
      )}
    </div>
  );
}
