import { forwardRef } from 'react';
import { Search, X } from 'lucide-react';
import './SearchBar.css';

export const SearchBar = forwardRef(function SearchBar(
  { value, onChange, placeholder = 'Search clients...', className = '' },
  ref
) {
  return (
    <div className={`search-bar ${className}`}>
      <Search size={18} className="search-bar__icon" />
      <input
        ref={ref}
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label="Search"
      />
      {value && (
        <button
          type="button"
          className="search-bar__clear"
          onClick={() => onChange('')}
          aria-label="Clear search"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
});
