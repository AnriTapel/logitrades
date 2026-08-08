<script lang="ts">
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import type {PageData, PageProps} from './$types';
	import type { Portfolio } from '$lib/types';
	import { setActivePortfolioId } from '$lib/stores/active-portfolio';
	import { formatIntToCurrency } from '$lib/formatters';
	import { localeStore } from '$lib/stores/locale';
	import { getFinancialColor, cn } from '$lib/utils';
	import Pencil from 'lucide-svelte/icons/pencil';
	import Archive from 'lucide-svelte/icons/archive';
	import ArchiveRestore from 'lucide-svelte/icons/archive-restore';
	import Trash2 from 'lucide-svelte/icons/trash-2';
	import Plus from 'lucide-svelte/icons/plus';
	import Check from 'lucide-svelte/icons/check';
	import X from 'lucide-svelte/icons/x';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import DateTimePicker from '$lib/components/custom/date-time-picker.svelte';
	import ConfirmationModal from '$lib/components/custom/confirmation-modal.svelte';
	import {
		Root as RadioGroupRoot,
		Item as RadioGroupItem,
	} from '$lib/components/ui/radio-group';
	import { formatPortfolioDateLocal } from '$lib/dates';

	let { data }: PageProps = $props();

	const isPro = $derived(data.plan === 'pro' || data.plan === 'max');
	const isMax = $derived(data.plan === 'max');

	// Create portfolio form
	let showCreateForm = $state(false);
	let newPortfolioName = $state('');

	// Rename state: portfolioId -> editing name
	let renamingId = $state<number | null>(null);
	let renameValue = $state('');

	// Capital edit state
	let editingCapitalId = $state<number | null>(null);
	let capitalValue = $state('');
	let startedAtValue = $state<string | undefined>(undefined);

	// Add transaction state
	let showAddTransaction = $state(false);
	let txType = $state<'deposit' | 'withdrawal'>('deposit');
	let txAmount = $state('');
	let txNote = $state('');
	let txDate = $state(new Date().toISOString());

	// Delete confirm state
	let confirmDeleteId = $state<number | null>(null);

	function handleRejectPortfolioDelete() {
		confirmDeleteId = null;
	}

	async function handleConfirmPortfolioDelete() {
		const portfolioId = confirmDeleteId;
		if (portfolioId == null) return;

		confirmDeleteId = null;

		const formData = new FormData();
		formData.append('id', portfolioId.toString());

		await fetch('?/delete', {
			method: 'POST',
			body: formData,
		});

		await invalidateAll();
	}

	function startRename(p: Portfolio) {
		renamingId = p.id;
		renameValue = p.name;
	}

	function cancelRename() {
		renamingId = null;
		renameValue = '';
	}

	function startCapitalEdit(p: Portfolio) {
		editingCapitalId = p.id;
		capitalValue = p.starting_capital != null ? String(p.starting_capital) : '';
		startedAtValue = p.started_at ?? undefined;
	}

	function cancelCapitalEdit() {
		editingCapitalId = null;
		capitalValue = '';
		startedAtValue = undefined;
	}

	async function handleSelectPortfolio(portfolioId: number) {
		setActivePortfolioId(portfolioId);
		const fd = new FormData();
		fd.append('id', String(portfolioId));
		await fetch('?/selectPortfolio', { method: 'POST', body: fd });
		await invalidateAll();
	}

	const activeId = $derived(data.activePortfolio?.id ?? null);

	function labelForTx(type: string): string {
		return type === 'deposit' ? 'Deposit' : 'Withdrawal';
	}
</script>

<svelte:head>
	<title>Portfolios | LogiTrades</title>
</svelte:head>

<section class="flex flex-col gap-8 max-w-4xl">
	<!-- Page header -->
	<div class="flex flex-col gap-1">
		<p class="text-[10px] font-bold uppercase tracking-[0.2em] text-[#4c6076]">
			Account Management
		</p>
		<h1 class="text-2xl font-extrabold tracking-tight text-[#1a1c1f]">
			Portfolios
		</h1>
	</div>

	<!-- Free plan notice -->
	{#if !isPro}
		<div
			class="rounded-lg border border-[#e2e8f0] bg-[#f8fafc] p-6 flex flex-col gap-3"
		>
			<p class="font-semibold text-[#1a1c1f]">
				Capital & Ledger features require Pro or Max
			</p>
			<p class="text-sm text-[#64748b]">
				Upgrade to Pro to unlock starting capital, deposits/withdrawals ledger,
				and account equity tracking. Your default portfolio is shown below in
				read-only mode.
			</p>
			<a href="/journal" class="text-sm text-[#0369a1] hover:underline"
				>← Back to Trades</a
			>
		</div>
	{/if}

	<!-- Portfolio list -->
	<div class="flex flex-col gap-4">
		<div class="flex items-center justify-between">
			<h2 class="text-lg font-semibold text-[#1a1c1f]">Your Portfolios</h2>
			{#if isMax && data.canCreateMore}
				<Button
					size="sm"
					class="bg-[#003d6d] hover:bg-[#003d6d]/90 text-white"
					onclick={() => {
						showCreateForm = true;
						newPortfolioName = '';
					}}
				>
					<Plus class="size-4 mr-1" />
					New Portfolio
				</Button>
			{:else if isMax && !data.canCreateMore}
				<span class="text-xs text-[#94a3b8]">Max 5 portfolios reached</span>
			{/if}
		</div>

		<!-- Create form -->
		{#if showCreateForm}
			<form
				method="POST"
				action="?/create"
				use:enhance={() => {
					return async ({ result, update }) => {
						if (result.type === 'success') {
							showCreateForm = false;
							newPortfolioName = '';
							await update();
						}
					};
				}}
				class="flex gap-2 rounded-lg border border-[#0369a1] bg-white p-3"
			>
				<Input
					name="name"
					placeholder="Portfolio name"
					bind:value={newPortfolioName}
					class="h-9"
					autofocus
					maxlength={64}
				/>
				<Button
					type="submit"
					size="sm"
					class="bg-[#003d6d] text-white shrink-0"
				>
					<Check class="size-4" />
				</Button>
				<Button
					type="button"
					size="sm"
					variant="ghost"
					onclick={() => (showCreateForm = false)}
					class="shrink-0"
				>
					<X class="size-4" />
				</Button>
			</form>
		{/if}

		{#each data.portfolios as portfolio (portfolio.id)}
			{@const isActive = portfolio.id === activeId}
			<div
				class={cn(
					'rounded-lg border bg-white p-4 flex flex-col gap-3 transition-colors',
					isActive ? 'border-[#0369a1] shadow-sm' : 'border-[#e2e8f0]',
					portfolio.status === 'archived' ? 'opacity-70' : '',
				)}
			>
				<!-- Portfolio header row -->
				<div class="flex items-center justify-between gap-3 flex-wrap">
					<div class="flex items-center gap-2 flex-wrap">
						<!-- Active indicator / select button -->
						{#if isActive}
							<span
								class="text-xs font-semibold text-[#0369a1] bg-[#e0f2fe] px-2 py-0.5 rounded"
							>
								Active
							</span>
						{:else}
							<Button
								variant="link"
								size="sm"
								type="button"
								class="h-auto p-0 text-xs text-[#64748b]"
								onclick={() => handleSelectPortfolio(portfolio.id)}
							>
								Switch
							</Button>
						{/if}

						{#if portfolio.is_default}
							<span class="text-xs text-[#94a3b8]">Default</span>
						{/if}

						{#if portfolio.status === 'archived'}
							<span
								class="text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded"
							>
								Archived
							</span>
						{/if}

						<!-- Name / Rename -->
						{#if renamingId === portfolio.id}
							<form
								method="POST"
								action="?/rename"
								use:enhance={() => {
									return async ({ result, update }) => {
										if (result.type === 'success') {
											renamingId = null;
											await update();
										}
									};
								}}
								class="flex items-center gap-1 ml-2"
							>
								<input type="hidden" name="id" value={portfolio.id} />
								<Input
									name="name"
									bind:value={renameValue}
									class="h-8 text-sm w-40"
									maxlength={64}
									autofocus
								/>
								<Button
									type="submit"
									size="sm"
									variant="ghost"
									class="h-8 w-8 p-0"
								>
									<Check class="size-3.5" />
								</Button>
								<Button
									type="button"
									size="sm"
									variant="ghost"
									class="h-8 w-8 p-0"
									onclick={cancelRename}
								>
									<X class="size-3.5" />
								</Button>
							</form>
						{:else}
							<span class="font-semibold text-[#1a1c1f] ml-2"
								>{portfolio.name}</span
							>
						{/if}
					</div>

					<!-- Action buttons -->
					{#if portfolio.status !== 'archived'}
						<div class="flex items-center gap-1 shrink-0">
							{#if renamingId !== portfolio.id}
								<Button
									variant="ghost"
									size="sm"
									type="button"
									class="h-8 w-8 p-0 text-[#64748b]"
									title="Rename"
									onclick={() => startRename(portfolio)}
								>
									<Pencil class="size-3.5" />
								</Button>
							{/if}

							{#if isPro}
								<form
									method="POST"
									action="?/archive"
									use:enhance={() => {
										return async ({ result, update }) => {
											if (result.type === 'success') await update();
										};
									}}
								>
									<input type="hidden" name="id" value={portfolio.id} />
									<Button
										variant="ghost"
										size="sm"
										type="submit"
										class="h-8 w-8 p-0 text-[#64748b]"
										title="Archive"
									>
										<Archive class="size-3.5" />
									</Button>
								</form>
							{/if}

							{#if !portfolio.is_default}
								<Button
									variant="ghost"
									size="sm"
									type="button"
									class="h-8 w-8 p-0 text-[#64748b]"
									title="Delete"
									onclick={() => (confirmDeleteId = portfolio.id)}
								>
									<Trash2 class="size-3.5" />
								</Button>
							{/if}
						</div>
					{:else}
						<!-- Archived: only allow unarchive -->
						<form
							method="POST"
							action="?/unarchive"
							use:enhance={() => {
								return async ({ result, update }) => {
									if (result.type === 'success') await update();
								};
							}}
						>
							<input type="hidden" name="id" value={portfolio.id} />
							<Button
								variant="link"
								size="sm"
								type="submit"
								class="h-auto p-0 text-xs text-[#0369a1]"
							>
								<ArchiveRestore class="size-3.5" />
								Unarchive
							</Button>
						</form>
					{/if}
				</div>

				<!-- Capital section — Pro/Max only, non-archived -->
				{#if isPro && portfolio.status !== 'archived'}
					<div class="border-t border-[#f3f3f7] pt-3">
						{#if editingCapitalId === portfolio.id}
							<form
								method="POST"
								action="?/updateCapital"
								use:enhance={() => {
									return async ({ result, update }) => {
										if (result.type === 'success') {
											editingCapitalId = null;
											await update();
										}
									};
								}}
								class="flex flex-col gap-3 sm:flex-row sm:items-end sm:gap-4"
							>
								<input type="hidden" name="id" value={portfolio.id} />
								<div class="flex flex-col gap-1">
									<Label
										class="text-[10px] font-bold uppercase tracking-[1px] text-[#94a3b8]"
									>
										Starting Capital
									</Label>
									<Input
										name="starting_capital"
										type="number"
										step="0.01"
										min="0"
										bind:value={capitalValue}
										placeholder="e.g. 10000"
										class="h-9 w-36"
									/>
								</div>
								<div class="flex flex-col gap-1">
									<Label
										class="text-[10px] font-bold uppercase tracking-[1px] text-[#94a3b8]"
									>
										Started At
									</Label>
									<DateTimePicker
										name="started_at"
										withTime={false}
										bind:value={startedAtValue}
									/>
								</div>
								<div class="flex gap-1 pb-0.5">
									<Button
										type="submit"
										size="sm"
										class="bg-[#003d6d] text-white h-9">Save</Button
									>
									<Button
										type="button"
										size="sm"
										variant="ghost"
										class="h-9"
										onclick={cancelCapitalEdit}
									>
										Cancel
									</Button>
								</div>
							</form>
						{:else}
							<div class="flex items-center gap-4 flex-wrap">
								<div class="flex flex-col gap-0.5">
									<span
										class="text-[10px] font-bold uppercase tracking-[1px] text-[#94a3b8]"
									>
										Starting Capital
									</span>
									<span class="text-sm font-semibold text-[#1a1c1f]">
										{portfolio.starting_capital != null
											? formatIntToCurrency(
													portfolio.starting_capital,
													$localeStore.currency,
												)
											: '—'}
									</span>
								</div>
								{#if portfolio.started_at}
									<div class="flex flex-col gap-0.5">
										<span
											class="text-[10px] font-bold uppercase tracking-[1px] text-[#94a3b8]"
										>
											Started
										</span>
										<span class="text-sm text-[#1a1c1f]">
											{formatPortfolioDateLocal(portfolio.started_at)}
										</span>
									</div>
								{/if}
								<Button
									variant="link"
									size="sm"
									type="button"
									class="h-auto p-0 text-xs text-[#0369a1]"
									onclick={() => startCapitalEdit(portfolio)}
								>
									Edit capital
								</Button>
							</div>
						{/if}
					</div>
				{/if}
			</div>
		{/each}
	</div>

	<!-- Ledger section — active portfolio, Pro/Max only -->
	{#if isPro && data.activePortfolio && data.activePortfolio.status !== 'archived'}
		<div class="flex flex-col gap-4">
			<div class="flex items-center justify-between">
				<h2 class="text-lg font-semibold text-[#1a1c1f]">
					Ledger — {data.activePortfolio.name}
				</h2>
				<Button
					size="sm"
					class="bg-[#003d6d] hover:bg-[#003d6d]/90 text-white"
					onclick={() => {
						showAddTransaction = !showAddTransaction;
					}}
				>
					<Plus class="size-4 mr-1" />
					Add Entry
				</Button>
			</div>

			<!-- Summary strip -->
			{#if data.portfolioSummary}
				<div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
					<div class="rounded-lg bg-[#f3f3f7] p-4 flex flex-col gap-1">
						<span
							class="text-[10px] font-bold uppercase tracking-wider text-[#4c6076]"
							>Account Equity</span
						>
						<span class="text-lg font-bold text-[#003d6d]">
							{formatIntToCurrency(
								data.portfolioSummary.equity,
								$localeStore.currency,
							)}
						</span>
					</div>
					<div class="rounded-lg bg-[#f3f3f7] p-4 flex flex-col gap-1">
						<span
							class="text-[10px] font-bold uppercase tracking-wider text-[#4c6076]"
							>Realized PnL</span
						>
						<span
							class={cn(
								'text-lg font-bold',
								getFinancialColor(data.portfolioSummary.realized_pnl, 0),
							)}
						>
							{formatIntToCurrency(
								data.portfolioSummary.realized_pnl,
								$localeStore.currency,
							)}
						</span>
					</div>
					<div class="rounded-lg bg-[#f3f3f7] p-4 flex flex-col gap-1">
						<span
							class="text-[10px] font-bold uppercase tracking-wider text-[#4c6076]"
							>Cash</span
						>
						<span class="text-lg font-bold text-[#1a1c1f]">
							{formatIntToCurrency(
								data.portfolioSummary.cash,
								$localeStore.currency,
							)}
						</span>
					</div>
					<div class="rounded-lg bg-[#f3f3f7] p-4 flex flex-col gap-1">
						<span
							class="text-[10px] font-bold uppercase tracking-wider text-[#4c6076]"
							>Return</span
						>
						<span
							class={cn(
								'text-lg font-bold',
								getFinancialColor(data.portfolioSummary.return_pct, 0),
							)}
						>
							{(data.portfolioSummary.return_pct * 100).toFixed(1)}%
						</span>
					</div>
				</div>
			{/if}

			<!-- Add transaction form -->
			{#if showAddTransaction}
				<form
					method="POST"
					action="?/addTransaction"
					use:enhance={() => {
						return async ({ result, update }) => {
							if (result.type === 'success') {
								showAddTransaction = false;
								txAmount = '';
								txNote = '';
								txDate = new Date().toISOString();
								await update();
							} else {
								console.error(result);
							}
						};
					}}
					class="rounded-lg border border-[#0369a1] bg-white p-4 flex flex-col gap-4 sm:flex-row sm:items-end sm:flex-wrap"
				>
					<input
						type="hidden"
						name="portfolio_id"
						value={data.activePortfolio.id}
					/>

					<div class="flex items-center gap-2">
						<div class="flex flex-col gap-1 mr-2">
							<Label
								class="text-[10px] font-bold uppercase tracking-[1px] text-[#94a3b8]"
								>Type</Label
							>

							<RadioGroupRoot
								bind:value={txType}
								name="type"
								class="flex flex-col gap-1"
							>
								<div class="flex items-center gap-1.5 text-sm cursor-pointer">
									<RadioGroupItem value="deposit" id="deposit" />
									<Label for="deposit">Deposit</Label>
								</div>

								<div class="flex items-center gap-1.5 text-sm cursor-pointer">
									<RadioGroupItem value="withdrawal" id="withdrawal" />
									<Label for="withdrawal">Withdrawal</Label>
								</div>
							</RadioGroupRoot>
						</div>

						<div class="flex flex-col gap-1">
							<Label
								class="text-[10px] font-bold uppercase tracking-[1px] text-[#94a3b8]"
								>Amount *</Label
							>
							<Input
								name="amount"
								type="number"
								step="0.01"
								min="0.01"
								required
								bind:value={txAmount}
								placeholder="e.g. 500"
								class="h-9 w-32"
							/>
						</div>

						<div class="flex flex-col gap-1">
							<Label
								class="text-[10px] font-bold uppercase tracking-[1px] text-[#94a3b8]"
								>Date</Label
							>
							<DateTimePicker
								name="occurred_at"
								withTime={false}
								bind:value={txDate}
							/>
						</div>

						<div class="flex flex-col gap-1 flex-1">
							<Label
								class="text-[10px] font-bold uppercase tracking-[1px] text-[#94a3b8]"
								>Note</Label
							>
							<Input
								name="note"
								bind:value={txNote}
								placeholder="Optional note"
								class="h-9"
								maxlength={128}
							/>
						</div>

						<div class="flex gap-2 pb-0.5 self-end">
							<Button
								type="submit"
								size="sm"
								class="bg-[#003d6d] text-white h-9">Add</Button
							>
							<Button
								type="button"
								size="sm"
								variant="ghost"
								class="h-9"
								onclick={() => (showAddTransaction = false)}
							>
								Cancel
							</Button>
						</div>
					</div>
				</form>
			{/if}

			<!-- Transaction list -->
			{#if data.transactions.length === 0}
				<p class="text-sm text-[#94a3b8] px-1">
					No transactions yet. Add a deposit or withdrawal to start tracking
					your capital.
				</p>
			{:else}
				<div class="rounded-lg border border-[#e2e8f0] overflow-hidden">
					<table class="w-full text-sm">
						<thead class="bg-[#f8fafc]">
							<tr>
								<th
									class="text-left px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-[#4c6076]"
									>Date</th
								>
								<th
									class="text-left px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-[#4c6076]"
									>Type</th
								>
								<th
									class="text-right px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-[#4c6076]"
									>Amount</th
								>
								<th
									class="text-left px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-[#4c6076] hidden sm:table-cell"
									>Note</th
								>
							</tr>
						</thead>
						<tbody>
							{#each data.transactions as tx (tx.id)}
								<tr class="border-t border-[#f3f3f7] hover:bg-[#f9f9fd]">
									<td class="px-4 py-3 text-[#1a1c1f]">
										{new Date(tx.occurred_at).toLocaleDateString('en-GB', {
											day: '2-digit',
											month: 'short',
											year: '2-digit',
										})}
									</td>
									<td class="px-4 py-3">
										<span
											class={cn(
												'text-xs font-semibold px-2 py-0.5 rounded',
												tx.type === 'deposit'
													? 'bg-green-50 text-green-700'
													: 'bg-red-50 text-red-600',
											)}
										>
											{labelForTx(tx.type)}
										</span>
									</td>
									<td
										class={cn(
											'px-4 py-3 text-right font-semibold tabular-nums',
											tx.type === 'deposit' ? 'text-green-700' : 'text-red-600',
										)}
									>
										{tx.type === 'withdrawal' ? '-' : '+'}{formatIntToCurrency(
											tx.amount,
											$localeStore.currency,
										)}
									</td>
									<td class="px-4 py-3 text-[#64748b] hidden sm:table-cell">
										{tx.note ?? '—'}
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			{/if}
		</div>
	{:else if isPro && data.activePortfolio?.status === 'archived'}
		<div
			class="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800"
		>
			This portfolio is archived. Unarchive it to add ledger entries.
		</div>
	{/if}
</section>

<ConfirmationModal
	open={confirmDeleteId != null}
	title="Delete portfolio"
	message="Are you sure you want to delete this portfolio? This cannot be undone."
	confirmButtonText="Delete"
	rejectButtonText="Cancel"
	onConfirm={handleConfirmPortfolioDelete}
	onReject={handleRejectPortfolioDelete}
/>
