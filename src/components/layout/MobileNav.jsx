import { LayoutDashboard, Users, Columns3, Settings } from 'lucide-react';
import './MobileNav.css';

const NAV = [
  { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
  { id: 'clients', label: 'Clients', icon: Users },
  { id: 'kanban', label: 'Pipeline', icon: Columns3 },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export function MobileNav({ view, onNavigate }) {
  return (
    <nav className="mobile-nav">
      {NAV.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          type="button"
          className={`mobile-nav__item ${view === id ? 'mobile-nav__item--active' : ''}`}
          onClick={() => onNavigate(id)}
        >
          <Icon size={22} />
          <span>{label}</span>
        </button>
      ))}
    </nav>
  );
}
