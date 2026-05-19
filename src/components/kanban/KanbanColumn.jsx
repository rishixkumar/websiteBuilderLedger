import { Plus } from 'lucide-react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { KanbanCard } from './KanbanCard';
import './KanbanBoard.css';

export function KanbanColumn({ stage, clients, onSelectClient, onAddToStage }) {
  const { setNodeRef, isOver } = useDroppable({ id: stage.id });

  return (
    <div
      ref={setNodeRef}
      className={`kanban-column ${isOver ? 'kanban-column--over' : ''}`}
    >
      <header className="kanban-column__header" style={{ borderColor: stage.color }}>
        <span className="kanban-column__dot" style={{ background: stage.color }} />
        <h3>{stage.label}</h3>
        <span className="kanban-column__count">{clients.length}</span>
      </header>
      <SortableContext items={clients.map((c) => c.id)} strategy={verticalListSortingStrategy}>
        <div className="kanban-column__cards">
          {clients.length === 0 && (
            <p className="kanban-column__empty">Drop clients here or add new</p>
          )}
          {clients.map((client) => (
            <KanbanCard key={client.id} client={client} onSelect={onSelectClient} />
          ))}
          <button
            type="button"
            className="kanban-column__add"
            onClick={() => onAddToStage?.(stage.id)}
          >
            <Plus size={16} />
            Add client
          </button>
        </div>
      </SortableContext>
    </div>
  );
}
