import React, { useState, useEffect, useRef } from 'react';

export interface OptionItem {
  id: string | number;
  label: string;
  sublabel?: string;
  data?: any;
}

interface SearchableSelectProps {
  options: OptionItem[];
  value: string | number;
  onChange: (val: string) => void;
  placeholder: string;
  isDark: boolean;
  disabled?: boolean;
}

export const SearchableSelect: React.FC<SearchableSelectProps> = ({
  options,
  value,
  onChange,
  placeholder,
  isDark,
  disabled = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(o => String(o.id) === String(value));

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOptions = options.filter(o =>
    o.label.toLowerCase().includes(search.toLowerCase()) ||
    (o.sublabel && o.sublabel.toLowerCase().includes(search.toLowerCase()))
  );

  const inputBg = isDark ? '#222122' : '#ffffff';
  const textColor = isDark ? 'text-white' : 'text-dark';
  const inputBorder = isDark ? '#3f3f46' : '#cbd5e1';
  const dropdownBg = isDark ? '#1a1a1c' : '#ffffff';
  const hoverBg = isDark ? '#2f2f32' : '#f1f5f9';

  return (
    <div className="position-relative" ref={wrapperRef}>
      <div
        className="form-control font-monospace d-flex justify-content-between align-items-center"
        style={{
          backgroundColor: inputBg,
          color: isDark ? '#fff' : '#000',
          borderColor: inputBorder,
          cursor: disabled ? 'not-allowed' : 'pointer'
        }}
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        <span className={!selectedOption ? 'opacity-50' : ''}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <i className={`bi bi-chevron-${isOpen ? 'up' : 'down'} opacity-75`}></i>
      </div>

      {isOpen && !disabled && (
        <div
          className="position-absolute w-100 mt-1 shadow-lg rounded border z-3"
          style={{
            backgroundColor: dropdownBg,
            borderColor: inputBorder,
            maxHeight: '220px',
            overflowY: 'auto'
          }}
        >
          <div className="p-2 border-bottom border-secondary">
            <input
              type="text"
              className={`form-control form-control-sm font-monospace ${textColor}`}
              style={{ backgroundColor: inputBg, borderColor: inputBorder }}
              placeholder="Escriba para buscar..."
              value={search}
              autoFocus
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          {filteredOptions.length === 0 ? (
            <div className="p-2 text-center text-muted small">No se encontraron resultados</div>
          ) : (
            filteredOptions.map((opt) => (
              <div
                key={opt.id}
                className="p-2 border-bottom border-secondary border-opacity-10 small"
                style={{ cursor: 'pointer' }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = hoverBg)}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                onClick={() => {
                  onChange(String(opt.id));
                  setIsOpen(false);
                  setSearch('');
                }}
              >
                <div className="fw-semibold">{opt.label}</div>
                {opt.sublabel && <div className="text-muted extra-small">{opt.sublabel}</div>}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};