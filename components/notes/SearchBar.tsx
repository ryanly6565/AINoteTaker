'use client'

import { Input } from "@mantine/core";

interface SearchBarProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export function SearchBar({ searchQuery, setSearchQuery }: SearchBarProps) {
  return (
    <Input
      placeholder="Search notes..."
      value={searchQuery}
      onChange={(event) => setSearchQuery(event.currentTarget.value)}
    />
  );
}