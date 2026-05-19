import { useMemo } from 'react';
import { Calendar, Star, AlertCircle, TrendingUp } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatDateTime, isCallOverdue, isCallUpcoming, formatRelative } from '../../lib/utils';
import { ClientCard } from '../clients/ClientCard';
import { Badge } from '../ui/Badge';
import './Dashboard.css';

export function Dashboard({ onSelectClient }) {
  const { state, dispatch, getStage } = useApp();
  const { clients, settings } = state;

  const stats = useMemo(() => {
    const byStage = {};
    for (const s of settings.pipelineStages) {
      byStage[s.id] = 0;
    }
    for (const c of clients.filter((x) => !x.archived)) {
      if (byStage[c.stageId] != null) byStage[c.stageId]++;
    }
    return { total: clients.filter((c) => !c.archived).length, byStage };
  }, [clients, settings.pipelineStages]);

  const upcomingCalls = useMemo(
    () =>
      clients
        .filter((c) => !c.archived && isCallUpcoming(c.fields?.nextCall, 7))
        .sort((a, b) => (a.fields?.nextCall || '').localeCompare(b.fields?.nextCall || '')),
    [clients]
  );

  const needsAttention = useMemo(
    () => clients.filter((c) => !c.archived && isCallOverdue(c.fields?.nextCall)),
    [clients]
  );

  const starred = useMemo(() => clients.filter((c) => c.starred && !c.archived), [clients]);

  const recent = useMemo(
    () =>
      [...clients]
        .filter((c) => !c.archived)
        .sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''))
        .slice(0, 5),
    [clients]
  );

  const openClient = (id) => {
    dispatch({ type: 'SELECT_CLIENT', id });
    dispatch({ type: 'SET_VIEW', view: 'clients' });
    onSelectClient?.(id);
  };

  return (
    <div className="dashboard">
      <header className="dashboard__hero">
        <h1>Dashboard</h1>
        <p>Your website projects at a glance</p>
      </header>

      <div className="dashboard__stats">
        <div className="stat-card">
          <TrendingUp size={20} />
          <div>
            <span className="stat-card__value">{stats.total}</span>
            <span className="stat-card__label">Total clients</span>
          </div>
        </div>
        <div className="stat-card stat-card--stages">
          {settings.pipelineStages
            .sort((a, b) => a.order - b.order)
            .map((s) => (
              <div key={s.id} className="stat-card__stage" style={{ '--stage-color': s.color }}>
                <span className="stat-card__value">{stats.byStage[s.id] || 0}</span>
                <span className="stat-card__label">{s.label}</span>
              </div>
            ))}
        </div>
      </div>

      {needsAttention.length > 0 && (
        <section className="dashboard__section dashboard__section--alert">
          <h2>
            <AlertCircle size={18} />
            Needs attention
          </h2>
          <div className="dashboard__cards">
            {needsAttention.map((c) => (
              <ClientCard key={c.id} client={c} onClick={() => openClient(c.id)} compact />
            ))}
          </div>
        </section>
      )}

      <section className="dashboard__section">
        <h2>
          <Calendar size={18} />
          Upcoming calls (7 days)
        </h2>
        {upcomingCalls.length === 0 ? (
          <p className="dashboard__empty">No calls scheduled this week</p>
        ) : (
          <ul className="dashboard__call-list">
            {upcomingCalls.map((c) => (
              <li key={c.id}>
                <button type="button" onClick={() => openClient(c.id)}>
                  <strong>{c.name}</strong>
                  <span>{formatDateTime(c.fields.nextCall)}</span>
                  <Badge variant="stage" color={getStage(c.stageId)?.color}>
                    {getStage(c.stageId)?.label}
                  </Badge>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {starred.length > 0 && (
        <section className="dashboard__section">
          <h2>
            <Star size={18} />
            Starred
          </h2>
          <div className="dashboard__cards">
            {starred.map((c) => (
              <ClientCard key={c.id} client={c} onClick={() => openClient(c.id)} compact />
            ))}
          </div>
        </section>
      )}

      <section className="dashboard__section">
        <h2>Recently updated</h2>
        <ul className="dashboard__recent">
          {recent.map((c) => (
            <li key={c.id}>
              <button type="button" onClick={() => openClient(c.id)}>
                <span>{c.name}</span>
                <span className="dashboard__recent-time">{formatRelative(c.updatedAt)}</span>
              </button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
