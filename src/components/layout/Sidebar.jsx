import {
  LayoutDashboard,
  Users,
  Columns3,
  Settings,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import './Sidebar.css';

const NAV = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'clients', label: 'Clients', icon: Users },
  { id: 'kanban', label: 'Pipeline', icon: Columns3 },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export function Sidebar({ view, onNavigate, collapsed, onToggleCollapse, clientCount = 0 }) {
  return (
    <aside className={`sidebar ${collapsed ? 'sidebar--collapsed' : ''}`}>
      <div className="sidebar__brand">
        {!collapsed && (
          <>
            <span className="sidebar__logo">SL</span>
            <span className="sidebar__title">SiteLedger</span>
          </>
        )}
        <button
          type="button"
          className="sidebar__toggle"
          onClick={onToggleCollapse}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>
      <nav className="sidebar__nav">
        {NAV.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            className={`sidebar__link ${view === id ? 'sidebar__link--active' : ''}`}
            onClick={() => onNavigate(id)}
            title={collapsed ? label : undefined}
          >
            <Icon size={20} />
            {!collapsed && <span>{label}</span>}
            {!collapsed && id === 'clients' && clientCount > 0 && (
              <span className="sidebar__badge">{clientCount}</span>
            )}
          </button>
        ))}
      </nav>
    </aside>
  );
}
