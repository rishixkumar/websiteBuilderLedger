import { Star, ExternalLink, MapPin, Copy, Clock } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Badge } from '../ui/Badge';
import { formatDateTime, isCallOverdue, isCallUpcoming } from '../../lib/utils';
import './ClientCard.css';

export function ClientCard({ client, onClick, compact }) {
  const { getStage, dispatch, showToast } = useApp();
  const stage = getStage(client.stageId);
  const website = client.fields?.website;
  const maps = client.fields?.googleMaps;
  const nextCall = client.fields?.nextCall;
  const overdue = isCallOverdue(nextCall);
  const upcoming = isCallUpcoming(nextCall);

  const copyUrl = (e, url) => {
    e.stopPropagation();
    if (!url) return;
    navigator.clipboard.writeText(url);
    showToast('Link copied');
  };

  const openLink = (e, url) => {
    e.stopPropagation();
    if (url) window.open(url, '_blank', 'noopener,noreferrer');
  };

  const toggleStar = (e) => {
    e.stopPropagation();
    dispatch({ type: 'TOGGLE_STAR', id: client.id });
  };

  return (
    <article
      className={`client-card ${compact ? 'client-card--compact' : ''} ${overdue ? 'client-card--overdue' : ''}`}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick?.()}
    >
      <div className="client-card__header">
        <div className="client-card__title-row">
          <h3>{client.name || 'Untitled client'}</h3>
          <button
            type="button"
            className={`client-card__star ${client.starred ? 'client-card__star--on' : ''}`}
            onClick={toggleStar}
            aria-label={client.starred ? 'Unstar' : 'Star'}
          >
            <Star size={16} fill={client.starred ? 'currentColor' : 'none'} />
          </button>
        </div>
        {stage && (
          <Badge variant="stage" color={stage.color}>
            {stage.label}
          </Badge>
        )}
      </div>

      {nextCall && (
        <div className={`client-card__call ${overdue ? 'client-card__call--overdue' : upcoming ? 'client-card__call--upcoming' : ''}`}>
          <Clock size={14} />
          <span>{formatDateTime(nextCall)}</span>
          {overdue && <Badge variant="warning">Overdue</Badge>}
        </div>
      )}

      {!compact && client.fields?.projectNotes && (
        <p className="client-card__notes">{client.fields.projectNotes}</p>
      )}

      {client.tags?.length > 0 && (
        <div className="client-card__tags">
          {client.tags.map((t) => (
            <Badge key={t}>{t}</Badge>
          ))}
        </div>
      )}

      <div className="client-card__actions" onClick={(e) => e.stopPropagation()}>
        {website && (
          <>
            <button type="button" onClick={(e) => openLink(e, website)} title="Open website">
              <ExternalLink size={15} />
            </button>
            <button type="button" onClick={(e) => copyUrl(e, website)} title="Copy URL">
              <Copy size={15} />
            </button>
          </>
        )}
        {maps && (
          <button type="button" onClick={(e) => openLink(e, maps)} title="Open maps">
            <MapPin size={15} />
          </button>
        )}
      </div>
    </article>
  );
}
