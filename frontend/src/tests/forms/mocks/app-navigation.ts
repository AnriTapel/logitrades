import { vi } from 'vitest';

export const goto = vi.fn(async () => {
	// no-op in tests
});

export const invalidate = vi.fn(async () => {});
export const invalidateAll = vi.fn(async () => {});
export const preloadData = vi.fn(async () => ({}));
export const beforeNavigate = vi.fn();
export const afterNavigate = vi.fn();
export const pushState = vi.fn();
export const replaceState = vi.fn();
