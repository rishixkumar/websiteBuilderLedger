import { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { AppShell } from './components/layout/AppShell';
import { Dashboard } from './components/dashboard/Dashboard';
import { ClientList } from './components/clients/ClientList';
import { KanbanBoard } from './components/kanban/KanbanBoard';
import { Settings } from './components/settings/Settings';
import { QuickAddModal } from './components/clients/QuickAddModal';
import { createEmptyClient } from './lib/defaults';

function AppContent() {
  const { state, dispatch, showToast } = useApp();
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const view = state.ui.view;

  const onAddClientManual = () => {
    const client = createEmptyClient('lead');
    client.name = 'New Client';
    dispatch({ type: 'ADD_CLIENT', client });
    dispatch({ type: 'SET_VIEW', view: 'clients' });
    showToast('Blank client created');
  };

  const renderView = () => {
    switch (view) {
      case 'dashboard':
        return <Dashboard />;
      case 'clients':
        return <ClientList onAddClient={() => setQuickAddOpen(true)} />;
      case 'kanban':
        return <KanbanBoard />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <>
      <AppShell
        onAddClient={() => setQuickAddOpen(true)}
        onAddClientManual={onAddClientManual}
      >
        {renderView()}
      </AppShell>
      <QuickAddModal open={quickAddOpen} onClose={() => setQuickAddOpen(false)} />
    </>
  );
}

function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;
