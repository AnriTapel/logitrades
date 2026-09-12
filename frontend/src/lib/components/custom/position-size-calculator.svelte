<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import ToggleGroup from '$lib/components/custom/toggle-group.svelte';
	import CurrencyCombobox from '$lib/components/custom/currency-combobox.svelte';
	import LeverageSlider from '$lib/components/custom/leverage-slider.svelte';
	import {
		Root as SelectRoot,
		Trigger as SelectTrigger,
		Content as SelectContent,
		Item as SelectItem,
	} from '$lib/components/ui/select';
	import { cn } from '$lib/utils';
	import { formatIntToCurrency, formatNumber } from '$lib/formatters';
	import {
		calculatePositionSize,
		SIZE_STEP_OPTIONS,
		type PositionSizeResult,
		type RiskMode,
		type SizeStepPreset,
	} from '$lib/position-size';
	import Info from 'lucide-svelte/icons/info';

	let {
		initialBalance = null,
		initialCurrency,
		embedded = false,
	}: {
		initialBalance?: number | null;
		initialCurrency: string;
		embedded?: boolean;
	} = $props();

	let resultsElement = $state<HTMLDivElement | null>(null);

	const fieldLabelClass = $derived(
		embedded
			? 'text-[10px] font-bold uppercase tracking-[1px] text-[#94a3b8]'
			: 'text-xs font-semibold uppercase tracking-[0.6px] text-[#4c6076]',
	);
	const inputClass = $derived(
		embedded
			? 'h-10 rounded border border-[rgba(194,199,207,0.2)] bg-white'
			: 'h-11 rounded border-transparent bg-[#f3f3f7]',
	);
	const cardClass = $derived(
		embedded
			? 'rounded-lg border border-[rgba(194,199,207,0.1)] bg-[rgba(243,243,247,0.3)] p-5 md:p-6 flex flex-col gap-6'
			: 'rounded-lg border border-[#e2e8f0] bg-white p-6 flex flex-col gap-6',
	);

	let accountBalance = $state('');
	let displayCurrency = $state('');
	let riskMode = $state<RiskMode>('PERCENTAGE');
	let riskValue = $state('2');
	let entryPrice = $state('');
	let stopLossPrice = $state('');
	let useLeverage = $state(false);
	let leverage = $state(1);
	let contractSize = $state('1');
	let sizeStep = $state<SizeStepPreset>('exact');
	let result = $state<PositionSizeResult | null>(null);

	$effect(() => {
		displayCurrency = initialCurrency;
	});

	$effect(() => {
		if (initialBalance != null) {
			accountBalance = String(initialBalance);
		}
	});

	const riskModeOptions = [
		{ label: '% of balance', value: 'PERCENTAGE' },
		{ label: 'Fixed amount', value: 'ABSOLUTE' },
	];

	function parsePositive(value: string): number {
		const parsed = Number(value);
		return Number.isFinite(parsed) ? parsed : NaN;
	}

	function handleCalculate() {
		result = calculatePositionSize({
			accountBalance: parsePositive(accountBalance),
			riskMode,
			riskValue: parsePositive(riskValue),
			entryPrice: parsePositive(entryPrice),
			stopLossPrice: parsePositive(stopLossPrice),
			leverage: useLeverage ? leverage : 1,
			contractSize: parsePositive(contractSize),
			sizeStep,
		});
		setTimeout(() => {
			resultsElement?.scrollIntoView({ behavior: 'smooth' });
		}, 0);
	}

	function formatSize(value: number): string {
		return formatNumber(value, 8);
	}
</script>

<div class="flex flex-col gap-6">
	<div class={cardClass}>
		<div class="grid grid-cols-1 gap-6 md:grid-cols-2">
			<div class="flex flex-col gap-2">
				<label class={fieldLabelClass} for="ps-account-balance">
					Account balance
				</label>
				<div class="flex gap-2">
					<Input
						id="ps-account-balance"
						type="number"
						class={cn(inputClass, 'flex-1')}
						step="0.01"
						min="0"
						placeholder="e.g. 10000"
						bind:value={accountBalance}
					/>
					<div class="w-[130px] shrink-0">
						<CurrencyCombobox bind:value={displayCurrency} />
					</div>
				</div>
			</div>

			<div class="flex flex-col gap-2">
				<span class={fieldLabelClass}>Risk mode</span>
				<ToggleGroup options={riskModeOptions} bind:value={riskMode} />
			</div>

			<div class="flex flex-col gap-2">
				<label class={fieldLabelClass} for="ps-risk-value">
					{riskMode === 'PERCENTAGE' ? 'Risk (%)' : `Risk (${displayCurrency})`}
				</label>
				<Input
					id="ps-risk-value"
					type="number"
					class={inputClass}
					step="0.01"
					min="0"
					placeholder={riskMode === 'PERCENTAGE' ? 'e.g. 2' : 'e.g. 200'}
					bind:value={riskValue}
				/>
			</div>

			<div class="flex flex-col gap-2">
				<label class={fieldLabelClass} for="ps-size-step">Size rounding</label>
				<SelectRoot
					type="single"
					value={sizeStep}
					onValueChange={(value) => {
						if (value) sizeStep = value as SizeStepPreset;
					}}
				>
					<SelectTrigger class={cn(inputClass, 'w-full')}>
						{SIZE_STEP_OPTIONS.find((o) => o.value === sizeStep)?.label ??
							'Select step'}
					</SelectTrigger>
					<SelectContent>
						{#each SIZE_STEP_OPTIONS as option (option.value)}
							<SelectItem value={option.value} label={option.label}>
								{option.label}
							</SelectItem>
						{/each}
					</SelectContent>
				</SelectRoot>
			</div>

			<div class="flex flex-col gap-2">
				<label class={fieldLabelClass} for="ps-entry-price">Entry price</label>
				<Input
					id="ps-entry-price"
					type="number"
					class={inputClass}
					step="0.000000001"
					min="0"
					placeholder="Planned entry"
					bind:value={entryPrice}
				/>
			</div>

			<div class="flex flex-col gap-2">
				<label class={fieldLabelClass} for="ps-stop-loss">Stop-loss price</label
				>
				<Input
					id="ps-stop-loss"
					type="number"
					class={inputClass}
					step="0.000000001"
					min="0"
					placeholder="Invalidation level"
					bind:value={stopLossPrice}
				/>
			</div>

			<div class="flex flex-col gap-2">
				<label class={fieldLabelClass} for="ps-contract-size">
					Contract size / multiplier
				</label>
				<Input
					id="ps-contract-size"
					type="number"
					class={inputClass}
					step="0.000000001"
					min="0"
					placeholder="1 for stocks/crypto, 100000 for forex"
					bind:value={contractSize}
				/>
			</div>
		</div>

		<LeverageSlider
			bind:enabled={useLeverage}
			bind:leverage
			labelClass={fieldLabelClass}
		/>

		<div class="flex flex-col gap-3">
			<Button
				type="button"
				class="w-full bg-[#003d6d] hover:bg-[#003d6d]/90 text-white sm:w-auto"
				onclick={handleCalculate}
			>
				Calculate
			</Button>

			<div
				class="flex gap-2 rounded-md border border-[#e2e8f0] bg-[#f8fafc] px-3 py-2.5 text-xs text-[#64748b]"
			>
				<Info class="size-4 shrink-0 mt-0.5 text-[#94a3b8]" />
				<p>
					Entry, stop-loss, and balance must already be in the selected currency
					({displayCurrency}). Leveraged positions may be liquidated slightly
					before your technical stop-loss. Trade fees are not included in these
					results.
				</p>
			</div>
		</div>
	</div>

	{#if result}
		<div
			bind:this={resultsElement}
			class={cn(
				'rounded-lg border p-6 flex flex-col gap-4',
				result.isValid
					? 'border-[#e2e8f0] bg-white'
					: 'border-destructive/30 bg-destructive/5',
			)}
		>
			<h3 class="text-sm font-bold uppercase tracking-[0.1em] text-[#1a1c1f]">
				Results
			</h3>

			{#if !result.isValid && result.validationMessage}
				<p class="text-sm font-medium text-destructive">
					{result.validationMessage}
				</p>
			{/if}

			<dl class="grid grid-cols-1 gap-4 sm:grid-cols-2">
				<div>
					<dt
						class="text-[10px] font-bold uppercase tracking-[1px] text-[#94a3b8]"
					>
						Position size (units / lots)
					</dt>
					<dd class="mt-1 text-lg font-semibold text-[#1a1c1f]">
						{formatSize(result.positionSize)}
					</dd>
				</div>
				<div>
					<dt
						class="text-[10px] font-bold uppercase tracking-[1px] text-[#94a3b8]"
					>
						Journal quantity
					</dt>
					<dd class="mt-1 text-lg font-semibold text-[#1a1c1f]">
						{formatSize(result.journalQuantity)}
					</dd>
				</div>
				<div>
					<dt
						class="text-[10px] font-bold uppercase tracking-[1px] text-[#94a3b8]"
					>
						Notional value
					</dt>
					<dd class="mt-1 text-lg font-semibold text-[#1a1c1f]">
						{formatIntToCurrency(result.notionalValue, displayCurrency)}
					</dd>
				</div>
				<div>
					<dt
						class="text-[10px] font-bold uppercase tracking-[1px] text-[#94a3b8]"
					>
						Required margin
					</dt>
					<dd class="mt-1 text-lg font-semibold text-[#1a1c1f]">
						{formatIntToCurrency(result.requiredMargin, displayCurrency)}
					</dd>
				</div>
				<div>
					<dt
						class="text-[10px] font-bold uppercase tracking-[1px] text-[#94a3b8]"
					>
						Actual risk
					</dt>
					<dd class="mt-1 text-lg font-semibold text-[#1a1c1f]">
						{formatIntToCurrency(result.actualRiskAmount, displayCurrency)}
					</dd>
				</div>
				<div>
					<dt
						class="text-[10px] font-bold uppercase tracking-[1px] text-[#94a3b8]"
					>
						Stop-loss distance
					</dt>
					<dd class="mt-1 text-lg font-semibold text-[#1a1c1f]">
						{formatNumber(result.stopLossPercent, 4)}%
					</dd>
				</div>
			</dl>
		</div>
	{/if}
</div>
