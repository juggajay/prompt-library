import { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import { Input } from '../ui/Input';
import { debounce } from '../../lib/utils';

interface SearchBarProps {
  onSearch: (query: string) => void;
  placeholder?: string;
}

export function SearchBar({ onSearch, placeholder = 'Search prompts...' }: SearchBarProps) {
  const [query, setQuery] = useState('');

  useEffect(() => {
    const debouncedSearch = debounce((value: string) => {
      onSearch(value);
    }, 300);

    debouncedSearch(query);
  }, [query, onSearch]);

  return (
    <div className="relative">
      <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-purple-400 w-5 h-5 z-10" />
      <Input
        type="text"
        placeholder={placeholder}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="pl-12"
      />
    </div>
  );
}
