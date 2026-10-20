import React, { createContext, useContext } from 'react';
import { AnimationMode, AnimationProvider, useAnimation } from './animation';
import { cx } from './hooks';
import { useFuiStyles } from './styles';

export type FuiTheme = 'cyan' | 'magenta' | 'amber';
export type AspectRatio = '16:9' | '21:9' | '4:3' | 'auto';

interface FuiGridSettings {
  theme: FuiTheme;
  aspectRatio: AspectRatio;
}

const FuiSettingsContext = createContext<FuiGridSettings>({ theme: 'cyan', aspectRatio: 'auto' });

export function useFuiSettings() {
  return useContext(FuiSettingsContext);
}

export interface FuiGridProviderProps extends React.HTMLAttributes<HTMLDivElement> {
  theme?: FuiTheme;
  aspectRatio?: AspectRatio;
  animationMode?: AnimationMode;
  respectReducedMotion?: boolean;
  sound?: boolean;
}

function Root({ theme, aspectRatio, forceMotion, className, style, children, ...rest }: FuiGridSettings & { forceMotion: boolean } & React.HTMLAttributes<HTMLDivElement>) {
  const { mode } = useAnimation();
  return (
    <div
      className={cx('fui-root', className)}
      data-fui-theme={theme}
      data-fui-motion={mode}
      data-fui-force-motion={forceMotion ? '' : undefined}
      style={{ ...(aspectRatio !== 'auto' ? { aspectRatio: aspectRatio.replace(':', ' / ') } : null), ...style }}
      {...rest}
    >
      {children}
    </div>
  );
}

/** Top-level provider: theme, aspect ratio and animation mode for the whole FUI tree. */
export function FuiGridProvider({
  theme = 'cyan',
  aspectRatio = 'auto',
  animationMode = 'balanced',
  respectReducedMotion = true,
  sound = true,
  ...rest
}: FuiGridProviderProps) {
  useFuiStyles();
  return (
    <AnimationProvider mode={animationMode} respectReducedMotion={respectReducedMotion} sound={sound}>
      <FuiSettingsContext.Provider value={{ theme, aspectRatio }}>
        <Root theme={theme} aspectRatio={aspectRatio} forceMotion={!respectReducedMotion} {...rest} />
      </FuiSettingsContext.Provider>
    </AnimationProvider>
  );
}
