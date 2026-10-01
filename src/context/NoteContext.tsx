import React, { createContext, useState, useContext, ReactNode } from 'react';
import { NoteCharacterItem } from '@/services/noteApi';

interface NoteContextType {
  noteCharacter: NoteCharacterItem | null;
  setNoteCharacter: (character: NoteCharacterItem | null) => void;
}

const NoteContext = createContext<NoteContextType | undefined>(undefined);

export function NoteProvider({ children }: { children: ReactNode }) {
  const [noteCharacter, setNoteCharacter] = useState<NoteCharacterItem | null>(null);

  return (
    <NoteContext.Provider value={{ noteCharacter, setNoteCharacter }}>
      {children}
    </NoteContext.Provider>
  );
}

export function useNote() {
  const context = useContext(NoteContext);
  if (!context) {
    throw new Error('useNote debe usarse dentro de un NoteProvider');
  }
  return context;
}
