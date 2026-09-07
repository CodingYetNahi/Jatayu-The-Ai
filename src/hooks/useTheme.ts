import { useEffect, useState } from 'react';
type Theme = 'light' | 'dark';
export function useTheme() { const [theme, setTheme] = useState<Theme>(() => (localStorage.getItem('jatayu:theme') as Theme | null) ?? (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')); useEffect(() => { document.documentElement.dataset.theme = theme; localStorage.setItem('jatayu:theme', theme); }, [theme]); return { theme, toggle: () => setTheme(t => t === 'dark' ? 'light' : 'dark') }; }
