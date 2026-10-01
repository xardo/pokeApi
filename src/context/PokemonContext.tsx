import React, { createContext, useState, useContext, ReactNode } from 'react';
import { Pokemon } from '@/services/pokeApi';

interface PokemonContextType {
  pokemon: Pokemon | null;
  setPokemon: (pokemon: Pokemon | null) => void;
}

const PokemonContext = createContext<PokemonContextType | undefined>(undefined);

export function PokemonProvider({ children }: { children: ReactNode }) {
  const [pokemon, setPokemon] = useState<Pokemon | null>(null);

  return (
    <PokemonContext.Provider value={{ pokemon, setPokemon }}>
      {children}
    </PokemonContext.Provider>
  );
}

export function usePokemon() {
  const context = useContext(PokemonContext);
  if (!context) {
    throw new Error('usePokemon debe usarse dentro de un PokemonProvider');
  }
  return context;
}
