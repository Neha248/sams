import { MaterialIcon } from '../atoms/MaterialIcon';

type SearchFieldProps = {
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
};

export function SearchField({
  placeholder = 'Search analytics, logs, or students...',
  value,
  onChange,
}: SearchFieldProps) {
  return (
    <div className="relative w-full max-w-md group">
      <MaterialIcon
        name="search"
        className="absolute left-4 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-primary transition-colors"
        size="sm"
      />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        className="w-full pl-12 pr-4 py-2 bg-surface-container-low/50 border border-outline-variant/30 rounded-full text-body-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all"
        placeholder={placeholder}
      />
    </div>
  );
}
