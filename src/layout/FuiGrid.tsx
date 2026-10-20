import React, { createContext, useContext, useRef } from 'react';
import { useBootStep } from '../core/boot';
import { cx } from '../core/hooks';
import { useFuiStyles } from '../core/styles';

type Gap = 'none' | 'sm' | 'md' | 'lg' | number;
type Breakpoint = 'base' | 'sm' | 'md' | 'lg' | 'xl';
export type ResponsiveSpan = number | Partial<Record<Breakpoint, number>>;

const GAPS: Record<Exclude<Gap, number>, string> = { none: '0px', sm: '8px', md: '16px', lg: '24px' };

const GridContext = createContext({ crosshairs: false, cols: 12 });

export interface FuiGridProps extends React.HTMLAttributes<HTMLDivElement> {
  cols?: number;
  gap?: Gap;
  /** Draw the column guide lines behind the items. */
  showGridLines?: boolean;
  /** Draw crosshair reticles at every item corner. */
  crosshairs?: boolean;
}

/** 12-column responsive SF grid. */
export function FuiGrid({ cols = 12, gap = 'md', showGridLines, crosshairs = false, className, style, children, ...rest }: FuiGridProps) {
  useFuiStyles();
  const gapValue = typeof gap === 'number' ? `${gap}px` : GAPS[gap];
  return (
    <GridContext.Provider value={{ crosshairs, cols }}>
      <div
        className={cx('fui-grid', className)}
        style={{ ['--fui-cols' as string]: cols, ['--fui-gap' as string]: gapValue, ...style }}
        {...rest}
      >
        {showGridLines && (
          <div className="fui-grid__lines" aria-hidden>
            {Array.from({ length: cols }, (_, i) => (
              <span key={i} />
            ))}
          </div>
        )}
        {children}
      </div>
    </GridContext.Provider>
  );
}

function spanVars(span: ResponsiveSpan | undefined, prefix = '--fui-span'): React.CSSProperties {
  if (span === undefined) return {};
  // A plain number is the desktop span; small screens stack full width.
  const map = typeof span === 'number' ? { md: span } : span;
  const out: Record<string, number> = {};
  for (const [bp, n] of Object.entries(map)) if (n !== undefined) out[`${prefix}-${bp}`] = n;
  return out as React.CSSProperties;
}

export interface FuiColProps extends React.HTMLAttributes<HTMLDivElement> {
  span?: ResponsiveSpan;
  /** Columns to skip before this one (md and up). */
  offset?: number;
  rowSpan?: number;
}

/** Plain grid column without decorations. */
export function FuiCol({ span, offset, rowSpan, className, style, ...rest }: FuiColProps) {
  useFuiStyles();
  return (
    <div
      className={cx('fui-col', className)}
      data-offset={offset ? '' : undefined}
      style={{
        ...spanVars(span),
        ...(offset ? { ['--fui-offset' as string]: offset + 1 } : null),
        ...(rowSpan ? { gridRow: `span ${rowSpan}` } : null),
        ...style,
      }}
      {...rest}
    />
  );
}

export interface FuiGridItemProps extends Omit<React.HTMLAttributes<HTMLElement>, 'title'> {
  span?: ResponsiveSpan;
  rowSpan?: number;
  /** Coordinate tag, rendered as `[SEC-01:A]`. */
  coordinate?: string;
  /** Section label shown next to the coordinate. */
  label?: React.ReactNode;
}

/** Grid section with guide lines, corner reticles and a coordinate tag. */
export function FuiGridItem({ span, rowSpan, coordinate, label, className, style, children, ...rest }: FuiGridItemProps) {
  useFuiStyles();
  const { crosshairs } = useContext(GridContext);
  const ref = useRef<HTMLElement>(null);
  const boot = useBootStep(ref);
  return (
    <section
      ref={ref}
      className={cx('fui-grid-item', className)}
      aria-label={typeof label === 'string' ? label : coordinate}
      {...boot.props}
      style={{ ...spanVars(span), ...(rowSpan ? { gridRow: `span ${rowSpan}` } : null), ...boot.style, ...style }}
      {...rest}
    >
      {(coordinate || label) && (
        <header className="fui-grid-item__tag">
          {coordinate && <span className="fui-grid-item__coord">[{coordinate}]</span>}
          {label && <span className="fui-grid-item__label">{label}</span>}
          <span className="fui-grid-item__rule" aria-hidden />
        </header>
      )}
      {crosshairs && (
        <span className="fui-crosshairs" aria-hidden>
          <i data-pos="tl" />
          <i data-pos="tr" />
          <i data-pos="bl" />
          <i data-pos="br" />
        </span>
      )}
      <div className="fui-grid-item__body">{children}</div>
    </section>
  );
}
