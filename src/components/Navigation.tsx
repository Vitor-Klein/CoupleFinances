import React from 'react';
import { BarChart3, Plus, List, TrendingUp, Users, Heart } from 'lucide-react';
import { useFinances } from '../context/FinancesContext';

interface NavigationProps {
  active: string;
  onNavigate: (page: string) => void;
}

function getInitials(name: string): string {
  return name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);
}

export const Navigation: React.FC<NavigationProps> = ({ active, onNavigate }) => {
  const { coupleProfile } = useFinances();

  return (
    <nav className="navigation">
      {/* Sidebar header — shown only on desktop */}
      <div className="nav-sidebar-header">
        <div className="nav-sidebar-brand">
          <Heart size={20} fill="currentColor" />
          <span>CoupleFinances</span>
        </div>
        <div className="nav-sidebar-couple">
          <div className="nav-couple-avatars">
            <div className="nav-avatar nav-avatar-1">
              {getInitials(coupleProfile.person1Name)}
            </div>
            <Heart size={11} className="nav-couple-heart" />
            <div className="nav-avatar nav-avatar-2">
              {getInitials(coupleProfile.person2Name)}
            </div>
          </div>
          <span className="nav-couple-names">
            {coupleProfile.person1Name} &amp; {coupleProfile.person2Name}
          </span>
        </div>
      </div>

      {/* Add button — circular on mobile, full-width on desktop */}
      <button
        type="button"
        className={`nav-item nav-item-add ${active === 'add' ? 'active' : ''}`}
        onClick={() => onNavigate('add')}
        aria-label="Nova transação"
      >
        <Plus size={24} />
        <span className="nav-add-label">Nova Transação</span>
      </button>

      <button
        type="button"
        className={`nav-item ${active === 'dashboard' ? 'active' : ''}`}
        onClick={() => onNavigate('dashboard')}
      >
        <BarChart3 size={22} />
        <span>Início</span>
      </button>

      <button
        type="button"
        className={`nav-item ${active === 'transactions' ? 'active' : ''}`}
        onClick={() => onNavigate('transactions')}
      >
        <List size={22} />
        <span>Extrato</span>
      </button>

      <button
        type="button"
        className={`nav-item ${active === 'analytics' ? 'active' : ''}`}
        onClick={() => onNavigate('analytics')}
      >
        <TrendingUp size={22} />
        <span>Análises</span>
      </button>

      <button
        type="button"
        className={`nav-item ${active === 'profile' ? 'active' : ''}`}
        onClick={() => onNavigate('profile')}
      >
        <Users size={22} />
        <span>Perfil</span>
      </button>
    </nav>
  );
};
