import { useMemo } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { createEmptyClient } from '../../lib/defaults';
import { searchClients } from '../../lib/utils';
import { KanbanColumn } from './KanbanColumn';
import { ClientCard } from '../clients/ClientCard';
import { EmptyState } from '../ui/EmptyState';
import { Columns3 } from 'lucide-react';
import './KanbanBoard.css';

export function KanbanBoard() {
  const { state, dispatch, showToast } = useApp();
  const [activeId, setActiveId] = useState(null);
  const { search } = state.ui;

  const clients = useMemo(
    () =>
      searchClients(state.clients, search, state.settings.fieldDefinitions).filter(
        (c) => !c.archived
      ),
    [state.clients, search, state.settings.fieldDefinitions]
  );

  const stages = useMemo(
    () => [...state.settings.pipelineStages].sort((a, b) => a.order - b.order),
    [state.settings.pipelineStages]
  );

  const clientsByStage = useMemo(() => {
    const map = {};
    for (const s of stages) map[s.id] = [];
    for (const c of clients) {
      if (map[c.stageId]) map[c.stageId].push(c);
      else {
        const first = stages[0]?.id;
        if (first) {
          if (!map[first]) map[first] = [];
          map[first].push(c);
        }
      }
    }
    return map;
  }, [clients, stages]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const activeClient = activeId ? state.clients.find((c) => c.id === activeId) : null;

  const handleDragStart = (event) => setActiveId(event.active.id);

  const handleDragEnd = (event) => {
    const { active, over } = event;
    setActiveId(null);
    if (!over) return;

    const clientId = active.id;
    let newStageId = over.id;
    const overClient = state.clients.find((c) => c.id === over.id);
    if (overClient) newStageId = overClient.stageId;

    const client = state.clients.find((c) => c.id === clientId);
    if (client && client.stageId !== newStageId && stages.some((s) => s.id === newStageId)) {
      dispatch({ type: 'SET_CLIENT_STAGE', clientId, stageId: newStageId });
    }
  };

  if (state.clients.length === 0) {
    return (
      <EmptyState
        icon={Columns3}
        title="No clients in pipeline"
        description="Add clients from the Clients tab, then drag cards between stages."
      />
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="kanban-board">
        {stages.map((stage) => (
          <KanbanColumn
            key={stage.id}
            stage={stage}
            clients={clientsByStage[stage.id] || []}
            onSelectClient={(id) => {
              dispatch({ type: 'SELECT_CLIENT', id });
              dispatch({ type: 'SET_VIEW', view: 'clients' });
            }}
            onAddToStage={(stageId) => {
              const client = createEmptyClient(stageId);
              client.name = 'New Client';
              dispatch({ type: 'ADD_CLIENT', client });
              dispatch({ type: 'SELECT_CLIENT', id: client.id });
              dispatch({ type: 'SET_VIEW', view: 'clients' });
              showToast(`Client added to ${stages.find((s) => s.id === stageId)?.label}`);
            }}
          />
        ))}
      </div>
      <DragOverlay>
        {activeClient ? (
          <div className="kanban-drag-overlay">
            <ClientCard client={activeClient} compact />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
