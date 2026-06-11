import React from 'react';
import { NavLink } from 'react-router-dom';
import { BarChart3, Plus, List, TrendingUp, Users, Heart, Target } from 'lucide-react';
import { useFinances } from '../context/FinancesContext';

function getInitials(name: string): string {
  return name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);
}

const navClass = ({ isActive }: { isActive: boolean }) => `nav-item ${isActive ? 'active' : ''}`;

export const Navigation: React.FC = () => {
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
      <NavLink
        to="/add"
        className={({ isActive }) => `nav-item nav-item-add ${isActive ? 'active' : ''}`}
        aria-label="Nova transação"
      >
        <Plus size={24} />
        <span className="nav-add-label">Nova Transação</span>
      </NavLink>

      <NavLink to="/" className={navClass} end>
        <BarChart3 size={22} />
        <span>Início</span>
      </NavLink>

      <NavLink to="/transactions" className={navClass}>
        <List size={22} />
        <span>Extrato</span>
      </NavLink>

      <NavLink to="/planning" className={navClass}>
        <Target size={22} />
        <span>Planejar</span>
      </NavLink>

      <NavLink to="/analytics" className={navClass}>
        <TrendingUp size={22} />
        <span>Análises</span>
      </NavLink>

      <NavLink to="/profile" className={navClass}>
        <Users size={22} />
        <span>Perfil</span>
      </NavLink>
    </nav>
  );
};
