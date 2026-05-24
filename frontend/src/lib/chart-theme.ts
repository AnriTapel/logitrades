/**
 * Chart.js colors aligned with `app.css` shadcn tokens.
 * `cssHslVar*` reads live CSS variables in the browser; fallbacks match :root for SSR.
 */
export const chartTheme = {
	foreground: 'hsl(204 9.1% 10.8%)',
	mutedForeground: 'hsl(200 8.6% 27.5%)',
	border: 'hsl(200 10.5% 77.6%)',
	background: 'hsl(210 33.3% 97.6%)',
	card: 'hsl(0 0% 100%)',
	primary: 'hsl(209.1 65.4% 40.8%)',
	primaryForeground: 'hsl(0 0% 100%)',
	/** Calm, non-neon PnL — institutional blue vs muted destructive */
	profit: 'hsl(209.1 45% 44%)',
	loss: 'hsl(0 40% 48%)',
	neutral: 'hsl(200 8.6% 27.5%)',
} as const;

function readCssVar(name: string): string {
	if (typeof document === 'undefined') return '';
	return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

/** `name` e.g. `--foreground`; values in app.css are `H S% L%` without `hsl()`. */
export function cssHslVar(name: string, fallback: string): string {
	const raw = readCssVar(name);
	if (!raw) return fallback;
	return `hsl(${raw})`;
}

export function cssHslVarAlpha(name: string, alpha: number, fallback: string): string {
	const raw = readCssVar(name);
	if (!raw) return fallback;
	return `hsl(${raw} / ${alpha})`;
}

/** Ambient grid: border token at low alpha */
export function chartGridColor(fallback = 'hsl(200 10.5% 77.6% / 0.12)'): string {
	const raw = readCssVar('--border');
	if (!raw) return fallback;
	return `hsl(${raw} / 0.12)`;
}
