'use client';

import React from 'react';
import { ThemeProvider as NextThemesProvider } from 'next-themes';

// Typ wyciągamy z samego komponentu, bez /dist/types
type ThemeProviderProps = React.ComponentProps<typeof NextThemesProvider>;

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
