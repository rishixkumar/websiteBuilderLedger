import { useRef, useEffect } from 'react';
import { Sparkles, PenLine, Keyboard } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useIsMobile } from '../../hooks/useMediaQuery';
import { Sidebar } from './Sidebar';
import { MobileNav } from './MobileNav';
import { SearchBar } from '../ui/SearchBar';
import { Toast } from '../ui/Toast';
import { SaveIndicator } from '../ui/SaveIndicator';
import { Button } from '../ui/Button';
import './AppShell.css';

export function AppShell({ children, onAddClient, onAddClientManual, onShowShortcuts }) {
  const { state, dispatch } = useApp();
  const isMobile = useIsMobile();
  const searchRef = useRef(null);
  const { view, search, sidebarCollapsed, toast, saveStatus } = state.ui;

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
      if (e.key === '?' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        onShowShortcuts?.();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onAddClient, onShowShortcuts]);

  const showSearch = view === 'clients' || view === 'kanban';

  return (
    <div className="app-shell">
      {!isMobile && (
        <Sidebar
          view={view}
          onNavigate={(v) => dispatch({ type: 'SET_VIEW', view: v })}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => dispatch({ type: 'TOGGLE_SIDEBAR' })}
          clientCount={state.clients.filter((c) => !c.archived).length}
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
            <SaveIndicator status={saveStatus} />
            {!isMobile && (
              <Button variant="ghost" size="sm" icon={Keyboard} onClick={onShowShortcuts} title="Shortcuts (?)">
                Shortcuts
              </Button>
            )}
            {!isMobile && onAddClientManual && (
              <Button variant="ghost" size="sm" icon={PenLine} onClick={onAddClientManual}>
                Blank client
              </Button>
            )}
            <Button variant="primary" size="sm" icon={Sparkles} onClick={onAddClient}>
              {isMobile ? 'Quick add' : 'Quick add'}
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
