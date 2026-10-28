import { AgChartTheme } from 'ag-charts-community';

// AG Charts draws to canvas, so it can't read the CSS tokens in styles.css.
// These values mirror them; keep the two in step when the palette changes.
export const CHART_COLORS = {
  accent: '#e3b53c',
  up: '#4cc38a',
  down: '#ef6b55',
  text: '#f3efe4',
  textMuted: '#aaa396',
  textFaint: '#8a8475',
  border: '#2f2a23',
  surfaceRaised: '#2b2721',
};

// Shared theme for every chart: dark base, transparent background so the
// chart sits on whatever card holds it, Geist type, gold-led categorical palette.
export const marketHiveChartTheme: AgChartTheme = {
  baseTheme: 'ag-default-dark',
  palette: {
    fills: ['#e3b53c', '#8fb3c9', '#c98a5a', '#9bb37a', '#b49ac9', '#d9cfa8', '#6f8f8a', '#a8735f'],
    strokes: ['#e3b53c', '#8fb3c9', '#c98a5a', '#9bb37a', '#b49ac9', '#d9cfa8', '#6f8f8a', '#a8735f'],
    up: { fill: CHART_COLORS.up, stroke: CHART_COLORS.up },
    down: { fill: CHART_COLORS.down, stroke: CHART_COLORS.down },
  },
  params: {
    fontFamily: 'Geist, system-ui, sans-serif',
    fontSize: 12,
    backgroundColor: 'transparent',
    foregroundColor: CHART_COLORS.text,
    textColor: CHART_COLORS.text,
    subtleTextColor: CHART_COLORS.textMuted,
    axisLineColor: CHART_COLORS.border,
    gridLineColor: CHART_COLORS.border,
    tooltipBackgroundColor: CHART_COLORS.surfaceRaised,
    tooltipTextColor: CHART_COLORS.text,
    tooltipSubtleTextColor: CHART_COLORS.textMuted,
    tooltipBorder: { color: '#403a2f' },
    tooltipBorderRadius: 8,
    accentColor: CHART_COLORS.accent,
  },
};
