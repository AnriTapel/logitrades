import { defineConfig } from 'vitest/config';
import path from 'path';
import { fileURLToPath } from 'url';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { svelteTesting } from '@testing-library/svelte/vite';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const libAlias = {
	$lib: path.resolve(__dirname, 'src/lib'),
};

export default defineConfig({
	test: {
		projects: [
			{
				resolve: { alias: libAlias },
				test: {
					name: 'unit',
					environment: 'node',
					include: ['src/tests/**/*.test.ts'],
					exclude: ['src/tests/forms/**'],
				},
			},
			{
				plugins: [
					svelte({
						compilerOptions: { dev: true },
					}),
					svelteTesting(),
				],
				resolve: {
					alias: {
						...libAlias,
						'$app/navigation': path.resolve(
							__dirname,
							'src/tests/forms/mocks/app-navigation.ts',
						),
						'$app/environment': path.resolve(
							__dirname,
							'src/tests/forms/mocks/app-environment.ts',
						),
						'$app/stores': path.resolve(
							__dirname,
							'src/tests/forms/mocks/app-stores.ts',
						),
						'$app/forms': path.resolve(
							__dirname,
							'src/tests/forms/mocks/app-forms.ts',
						),
					},
				},
				test: {
					name: 'component',
					environment: 'happy-dom',
					include: ['src/tests/forms/**/*.test.ts'],
					setupFiles: ['src/tests/forms/setup.ts'],
				},
			},
		],
	},
});
