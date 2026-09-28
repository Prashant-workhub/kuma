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
      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg font-medium text-xs transition-all duration-150 select-none cursor-pointer ${
        active
          ? 'bg-[#992e9d]/10 dark:bg-purple-500/15 text-[#992e9d] dark:text-purple-300 font-semibold'
          : 'bg-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200'
      }`}
    >
      <div className={`relative shrink-0 flex items-center justify-center w-4 h-4 ${active ? 'text-[#992e9d] dark:text-purple-300' : 'text-slate-400 dark:text-slate-500'}`}>
        {icon}
        {hasNotificationDot && (
          <span 
            className={`absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full ring-2 ring-white dark:ring-slate-900 ${dotColorClass[notificationColor]}`} 
          />
        )}
      </div>

      {!collapsed && (
        <span className={`truncate flex-1 text-left ${active ? 'text-[#992e9d] dark:text-purple-300 font-semibold' : 'text-slate-700 dark:text-slate-300'}`}>
          {label}
        </span>
      )}

      {!collapsed && badge !== undefined && (
        <span className={`px-2 py-0.5 text-[10px] font-medium rounded-md ${
          active 
            ? 'bg-[#992e9d]/20 text-[#992e9d] dark:text-purple-300' 
            : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
        }`}>
          {badge}
        </span>
      )}
    </button>
  );
};
