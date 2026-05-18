import { AppProvider, useApp } from './context/AppContext';
import { AppShell, useQuickAddClient } from './components/layout/AppShell';
import { Dashboard } from './components/dashboard/Dashboard';
import { ClientList } from './components/clients/ClientList';
import { KanbanBoard } from './components/kanban/KanbanBoard';
import { Settings } from './components/settings/Settings';

function AppContent() {
  const { state } = useApp();
  const onAddClient = useQuickAddClient();
  const view = state.ui.view;

  const renderView = () => {
    switch (view) {
      case 'dashboard':
        return <Dashboard />;
      case 'clients':
        return <ClientList onAddClient={onAddClient} />;
      case 'kanban':
        return <KanbanBoard />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard />;
    }
  };

  return <AppShell onAddClient={onAddClient}>{renderView()}</AppShell>;
}

function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;
