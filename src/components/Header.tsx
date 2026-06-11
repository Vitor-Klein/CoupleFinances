import React from 'react';
import { Heart, Eye, EyeOff } from 'lucide-react';
import { useFinances } from '../context/FinancesContext';
import { usePrivacy } from '../context/PrivacyContext';

interface HeaderProps {
  title: string;
}

export const Header: React.FC<HeaderProps> = ({ title }) => {
  const { coupleProfile } = useFinances();
  const { hideValues, toggleHideValues } = usePrivacy();

  const p1 = coupleProfile.person1Name;
  const p2 = coupleProfile.person2Name;
  const isCustomized = p1 !== 'Eu' || p2 !== 'Parceiro(a)';

  return (
    <header className="header">
      <div className="header-content">
        <div className="header-logo">
          <Heart size={22} fill="currentColor" />
          <h1>CoupleFinances</h1>
        </div>
        {isCustomized && (
          <div className="header-couple">
            <span className="header-person">{p1}</span>
            <Heart size={12} fill="currentColor" className="header-heart" />
            <span className="header-person">{p2}</span>
          </div>
        )}
        <div className="header-title-row">
          <h2 className="header-title">{title}</h2>
          <button
            type="button"
            className="privacy-toggle"
            onClick={toggleHideValues}
            aria-pressed={hideValues}
            aria-label={hideValues ? 'Mostrar valores' : 'Ocultar valores'}
            title={hideValues ? 'Mostrar valores' : 'Ocultar valores'}
          >
            {hideValues ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
      </div>
    </header>
  );
};
