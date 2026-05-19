import { useAuthStore } from '../../store/authStore';
import { MaterialIcon } from '../atoms/MaterialIcon';
import { SearchField } from '../molecules/SearchField';

type AdminTopBarProps = {
  searchQuery: string;
  onSearchChange: (q: string) => void;
};

export function AdminTopBar({ searchQuery, onSearchChange }: AdminTopBarProps) {
  const { logout } = useAuthStore();

  return (
    <header className="fixed top-0 right-0 h-navbar-height z-40 bg-surface/80 backdrop-blur-xl flex items-center justify-between px-gutter w-[calc(100%-280px)] ml-sidebar-width border-b border-white/20 shadow-sm">
      <div className="flex items-center gap-6 flex-1">
        <h2 className="font-outfit text-title-lg font-black text-primary">SAMS Dashboard</h2>
        <SearchField value={searchQuery} onChange={onSearchChange} />
      </div>
      <div className="flex items-center gap-4">
        <button
          type="button"
          className="w-10 h-10 flex items-center justify-center text-on-surface-variant hover:bg-surface-container-low rounded-full transition-all relative"
        >
          <MaterialIcon name="notifications" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-error rounded-full border-2 border-surface" />
        </button>
        <div className="h-8 w-px bg-outline-variant/30" />
        <button
          type="button"
          onClick={logout}
          className="flex items-center gap-3 cursor-pointer hover:bg-surface-container-low px-3 py-1.5 rounded-full transition-all"
        >
          <div className="text-right">
            <p className="text-label-md font-bold text-primary">Admin Portal</p>
            <p className="text-[10px] uppercase tracking-widest text-outline">Terminal A-12</p>
          </div>
          <MaterialIcon name="expand_more" className="text-primary" />
        </button>
      </div>
    </header>
  );
}

