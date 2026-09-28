import React from 'react';

export interface SidebarItemProps {
  icon: React.ReactNode;
  label: string;
  badge?: string | number;
  active?: boolean;
  hasNotificationDot?: boolean;
  notificationColor?: 'red' | 'yellow' | 'green' | 'purple';
  onClick?: () => void;
  collapsed?: boolean;
}

export const SidebarItem: React.FC<SidebarItemProps> = ({
  icon,
  label,
  badge,
  active = false,
  hasNotificationDot = false,
  notificationColor = 'purple',
  onClick,
  collapsed = false,
}) => {
  const dotColorClass = {
    red: 'bg-rose-500',
    yellow: 'bg-amber-400',
    green: 'bg-emerald-500',
    purple: 'bg-[#992e9d]',
  };

  return (
    <button
      onClick={onClick}
      title={collapsed ? label : undefined}
      className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-full font-medium text-xs tracking-wide transition-all duration-200 select-none cursor-pointer ${
        active
          ? 'bg-[#992e9d] text-white font-semibold shadow-sm shadow-purple-900/20'
          : 'bg-transparent text-slate-600 dark:text-slate-300 hover:bg-purple-50/80 dark:hover:bg-slate-800/60 hover:text-[#992e9d] dark:hover:text-purple-300'
      }`}
    >
      <div className={`relative shrink-0 flex items-center justify-center w-4 h-4 ${active ? 'text-white' : 'text-slate-500 dark:text-slate-400'}`}>
        {icon}
        {hasNotificationDot && (
          <span 
            className={`absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full ring-2 ring-white dark:ring-slate-900 ${dotColorClass[notificationColor]}`} 
          />
        )}
      </div>

      {!collapsed && (
        <span className={`truncate flex-1 text-left ${active ? 'text-white font-semibold' : 'text-slate-700 dark:text-slate-200'}`}>
          {label}
        </span>
      )}

      {!collapsed && badge !== undefined && (
        <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-full ${
          active 
            ? 'bg-white/20 text-white' 
            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
        }`}>
          {badge}
        </span>
      )}
    </button>
  );
};
