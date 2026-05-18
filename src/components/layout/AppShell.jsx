import { useRef, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useIsMobile } from '../../hooks/useMediaQuery';
import { Sidebar } from './Sidebar';
import { MobileNav } from './MobileNav';
import { SearchBar } from '../ui/SearchBar';
import { Toast } from '../ui/Toast';
import { Button } from '../ui/Button';
import { createEmptyClient } from '../../lib/defaults';
import './AppShell.css';

export function AppShell({ children, onAddClient }) {
  const { state, dispatch } = useApp();
  const isMobile = useIsMobile();
  const searchRef = useRef(null);
  const { view, search, sidebarCollapsed, toast } = state.ui;

  useEffect(() => {
    const handler = (e) => {
      if (e.target.matches('input, textarea, select')) return;
      if (e.key === '/' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        searchRef.current?.focus();
      }
      if (e.key === 'n' && !e.metaKey && !e.ctrlKey) {
        onAddClient?.();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onAddClient]);

  const showSearch = view === 'clients' || view === 'kanban';

  return (
    <div className="app-shell">
      {!isMobile && (
        <Sidebar
          view={view}
          onNavigate={(v) => dispatch({ type: 'SET_VIEW', view: v })}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => dispatch({ type: 'TOGGLE_SIDEBAR' })}
        />
      )}
      <div className="app-shell__main">
        <header className="app-header">
          <div className="app-header__left">
            {isMobile && <span className="app-header__brand">SiteLedger</span>}
          </div>
          {showSearch && (
            <SearchBar
              ref={searchRef}
              value={search}
              onChange={(s) => dispatch({ type: 'SET_SEARCH', search: s })}
              className="app-header__search"
            />
          )}
          <div className="app-header__actions">
            <Button variant="primary" size="sm" icon={Plus} onClick={onAddClient}>
              {isMobile ? 'Add' : 'Add client'}
            </Button>
          </div>
        </header>
        <main className="app-main">{children}</main>
      </div>
      {isMobile && (
        <MobileNav view={view} onNavigate={(v) => dispatch({ type: 'SET_VIEW', view: v })} />
      )}
      <Toast message={toast?.message} type={toast?.type} />
    </div>
  );
}

export function useQuickAddClient() {
  const { dispatch, showToast } = useApp();
  return () => {
    const client = createEmptyClient('lead');
    client.name = 'New Client';
    dispatch({ type: 'ADD_CLIENT', client });
    dispatch({ type: 'SET_VIEW', view: 'clients' });
    showToast('Client created — edit the name below');
  };
}
