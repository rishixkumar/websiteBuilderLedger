import { useMemo } from 'react';
import { Users } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useIsMobile } from '../../hooks/useMediaQuery';
import { searchClients, isCallUpcoming } from '../../lib/utils';
import { ClientCard } from './ClientCard';
import { ClientDetail } from './ClientDetail';
import { Drawer } from '../ui/Drawer';
import { EmptyState } from '../ui/EmptyState';
import { Button } from '../ui/Button';
import './ClientList.css';

function sortClients(clients, sort) {
  const copy = [...clients];
  switch (sort) {
    case 'name':
      return copy.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    case 'call':
      return copy.sort((a, b) => {
        const ac = a.fields?.nextCall || '';
        const bc = b.fields?.nextCall || '';
        if (!ac && !bc) return 0;
        if (!ac) return 1;
        if (!bc) return -1;
        return ac.localeCompare(bc);
      });
    case 'updated':
    default:
      return copy.sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''));
  }
}

function filterClients(clients, filters) {
  return clients.filter((c) => {
    if (filters.stageId && c.stageId !== filters.stageId) return false;
    if (filters.starred && !c.starred) return false;
    if (filters.upcomingCall && !isCallUpcoming(c.fields?.nextCall)) return false;
    return true;
  });
}

export function ClientList({ onAddClient }) {
  const { state, dispatch } = useApp();
  const isMobile = useIsMobile();
  const { search, filters, sort, selectedClientId } = state.ui;

  const filtered = useMemo(() => {
    let list = searchClients(state.clients, search, state.settings.fieldDefinitions);
    list = filterClients(list, filters);
    return sortClients(list, sort);
  }, [state.clients, state.settings.fieldDefinitions, search, filters, sort]);

  const selectedClient = selectedClientId
    ? state.clients.find((c) => c.id === selectedClientId)
    : null;

  const openClient = (id) => dispatch({ type: 'SELECT_CLIENT', id });
  const closeDetail = () => dispatch({ type: 'SELECT_CLIENT', id: null });

  const showDetailPanel = !isMobile && selectedClient;

  return (
    <div className={`client-list-view ${showDetailPanel ? 'client-list-view--split' : ''}`}>
      <div className="client-list-view__list">
        <div className="client-list-toolbar">
          <select
            value={filters.stageId}
            onChange={(e) => dispatch({ type: 'SET_FILTERS', filters: { stageId: e.target.value } })}
            aria-label="Filter by stage"
          >
            <option value="">All stages</option>
            {state.settings.pipelineStages
              .sort((a, b) => a.order - b.order)
              .map((s) => (
                <option key={s.id} value={s.id}>{s.label}</option>
              ))}
          </select>
          <select value={sort} onChange={(e) => dispatch({ type: 'SET_SORT', sort: e.target.value })} aria-label="Sort">
            <option value="updated">Recently updated</option>
            <option value="name">Name</option>
            <option value="call">Next call</option>
          </select>
          <label className="client-list-toolbar__check">
            <input
              type="checkbox"
              checked={filters.starred}
              onChange={(e) => dispatch({ type: 'SET_FILTERS', filters: { starred: e.target.checked } })}
            />
            Starred
          </label>
          <label className="client-list-toolbar__check">
            <input
              type="checkbox"
              checked={filters.upcomingCall}
              onChange={(e) => dispatch({ type: 'SET_FILTERS', filters: { upcomingCall: e.target.checked } })}
            />
            Upcoming calls
          </label>
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No clients found"
            description={state.clients.length === 0 ? 'Add your first client to get started.' : 'Try adjusting filters or search.'}
            action={
              <Button variant="primary" onClick={onAddClient}>
                Add client
              </Button>
            }
          />
        ) : (
          <div className="client-grid">
            {filtered.map((c) => (
              <ClientCard
                key={c.id}
                client={c}
                onClick={() => openClient(c.id)}
                compact={showDetailPanel}
              />
            ))}
          </div>
        )}
      </div>

      {showDetailPanel && (
        <aside className="client-list-view__detail">
          <ClientDetail clientId={selectedClientId} onClose={closeDetail} />
        </aside>
      )}

      {isMobile && (
        <Drawer
          open={!!selectedClient}
          onClose={closeDetail}
          title={selectedClient?.name || 'Client'}
        >
          {selectedClientId && <ClientDetail clientId={selectedClientId} onClose={closeDetail} />}
        </Drawer>
      )}
    </div>
  );
}
