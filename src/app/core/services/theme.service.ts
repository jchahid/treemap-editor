import { Injectable, signal, effect } from '@angular/core';

export type Theme = 'light' | 'dark' | 'high-contrast';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private readonly THEME_KEY = 'treemap-editor-theme';
  
  theme = signal<Theme>(this.getInitialTheme());

  constructor() {
    effect(() => {
      const currentTheme = this.theme();
      document.documentElement.setAttribute('data-theme', currentTheme);
      localStorage.setItem(this.THEME_KEY, currentTheme);
    });
  }

  toggleTheme() {
    this.theme.update(current => {
      if (current === 'light') return 'dark';
      if (current === 'dark') return 'high-contrast';
      return 'light';
    });
  }

  private getInitialTheme(): Theme {
    const saved = localStorage.getItem(this.THEME_KEY) as Theme;
    if (saved && ['light', 'dark', 'high-contrast'].includes(saved)) {
      return saved;
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
}
