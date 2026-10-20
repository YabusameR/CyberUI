import { useInsertionEffect } from 'react';
import css from '../styles/fui.css?inline';

const STYLE_ID = 'fui-ui-styles';

/**
 * Injects the library stylesheet into <head> the first time any component renders,
 * so consumers never import a CSS file. Prepended so app styles can override it.
 */
export function useFuiStyles() {
  useInsertionEffect(() => {
    if (typeof document === 'undefined' || document.getElementById(STYLE_ID)) return;
    const el = document.createElement('style');
    el.id = STYLE_ID;
    el.textContent = css;
    document.head.prepend(el);
  }, []);
}

/** The raw stylesheet, for SSR (render it into a <style> tag on the server). */
export const fuiStyles = css;
