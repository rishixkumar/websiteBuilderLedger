import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { KanbanCard } from './KanbanCard';
import './KanbanBoard.css';

export function KanbanColumn({ stage, clients, onSelectClient }) {
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
          {clients.map((client) => (
            <KanbanCard key={client.id} client={client} onSelect={onSelectClient} />
          ))}
        </div>
      </SortableContext>
    </div>
  );
}
