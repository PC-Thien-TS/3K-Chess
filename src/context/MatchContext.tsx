import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Faction, FactionConfig, MatchConfig } from '../rules/threeKingdomRules';

interface MatchContextType {
  config: MatchConfig;
  updateConfig: (newConfig: MatchConfig) => void;
}

const DEFAULT_CONFIG: MatchConfig = {
  factions: {
    Shu: { control: 'Human', difficulty: 'easy' },
    Wei: { control: 'Bot', difficulty: 'easy' },
    Wu: { control: 'Bot', difficulty: 'easy' },
    None: { control: 'Human', difficulty: 'easy' }
  },
  primaryKingdom: 'Shu'
};

const MatchContext = createContext<MatchContextType | undefined>(undefined);

export function MatchProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<MatchConfig>(DEFAULT_CONFIG);

  const updateConfig = (newConfig: MatchConfig) => {
    setConfig(newConfig);
  };

  return (
    <MatchContext.Provider value={{ config, updateConfig }}>
      {children}
    </MatchContext.Provider>
  );
}

export function useMatchContext() {
  const context = useContext(MatchContext);
  if (context === undefined) {
    throw new Error('useMatchContext must be used within a MatchProvider');
  }
  return context;
}
