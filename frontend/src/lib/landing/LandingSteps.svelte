<script lang="ts">
	import { desktopSteps, steps } from '$lib/landing/data';
</script>

<section
	class="mx-auto w-full max-w-[1280px] px-6 pt-4 mt-8 lg:bg-muted lg:py-24 lg:mt-2"
>
	<div class="mx-auto w-full max-w-[390px] lg:hidden">
		<p
			class="text-xs font-semibold uppercase tracking-[1.2px] text-muted-foreground"
		>
			The Process
		</p>
		<h2 class="mt-2 text-4xl font-extrabold leading-tight text-primary">
			Three steps to mastery.
		</h2>

		<div class="mt-8 space-y-10">
			{#each steps as step, i}
				<div class="flex items-start gap-6">
					<div
						class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-base font-bold text-primary-foreground"
					>
						{i + 1}
					</div>
					<div class="space-y-2">
						<h3 class="text-lg font-bold text-foreground">{step.title}</h3>
						<p class="text-base leading-6 text-muted-foreground">
							{step.description}
						</p>
					</div>
				</div>
			{/each}
		</div>
	</div>

	<div class="hidden grid-cols-3 gap-16 lg:grid">
		{#each desktopSteps as step, i}
			<div class="space-y-6">
				<div
					class="flex h-12 w-12 items-center justify-center rounded bg-primary text-[20px] font-semibold text-primary-foreground"
				>
					{i + 1}
				</div>
				<h3 class="text-[24px] font-bold leading-8 text-foreground">
					{step.title}
				</h3>
				<p class="text-base leading-[26px] text-muted-foreground">
					{step.description}
				</p>
			</div>
		{/each}
	</div>
</section>
