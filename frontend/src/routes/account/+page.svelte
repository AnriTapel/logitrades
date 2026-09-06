<script lang="ts">
	import { enhance } from '$app/forms';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import EmptyState from '$lib/components/custom/empty-state.svelte';
	import { formatPortfolioDateLocal } from '$lib/dates';
	import type { PlanVariant, SubscriptionInvoice } from '$lib/types';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	const user = $derived(data.user);
	const plan = $derived(data.plan ?? 'free');
	const subscription = $derived(data.subscription);
	const invoices = $derived(data.invoices ?? []);

	const isPaidPlan = $derived(plan !== 'free');

	const planDisplayName = $derived(
		plan === 'max' ? 'Max' : plan === 'pro' ? 'Pro' : 'Free',
	);

	function cadenceLabel(planVariant: PlanVariant | null | undefined): string {
		if (!planVariant) return '';
		return planVariant.endsWith('_annually') ? 'per year' : 'per month';
	}

	function latestInvoiceAmount(items: SubscriptionInvoice[]): string | null {
		const paid = items.find((inv) => inv.total_formatted);
		return paid?.total_formatted ?? null;
	}

	const subscriptionCost = $derived.by(() => {
		if (!isPaidPlan) return '$0 / month';
		const amount = latestInvoiceAmount(invoices);
		const cadence = cadenceLabel(subscription?.plan_variant);
		if (amount && cadence) return `${amount} ${cadence}`;
		if (cadence) return cadence;
		return '—';
	});

	const expirationLabel = $derived.by(() => {
		if (!isPaidPlan || !subscription) return '—';
		if (subscription.ends_at) {
			return formatPortfolioDateLocal(subscription.ends_at);
		}
		if (subscription.renews_at) {
			return formatPortfolioDateLocal(subscription.renews_at);
		}
		return '—';
	});

	const expirationCaption = $derived(
		subscription?.ends_at
			? 'Ends on'
			: subscription?.renews_at
				? 'Renews on'
				: 'Expiration',
	);

	function formatBillingReason(reason: string | null | undefined): string {
		if (!reason) return '—';
		return reason
			.split('_')
			.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
			.join(' ');
	}

	function formatInvoiceDate(iso: string | null | undefined): string {
		if (!iso) return '—';
		return formatPortfolioDateLocal(iso);
	}

	function formatStatus(status: string | null | undefined): string {
		if (!status) return '—';
		return status.charAt(0).toUpperCase() + status.slice(1);
	}
</script>

<svelte:head>
	<title>Account | LogiTrades</title>
</svelte:head>

<section class="flex flex-col gap-8 max-w-4xl">
	<div class="flex flex-col gap-1">
		<p class="text-[10px] font-bold uppercase tracking-[0.2em] text-[#4c6076]">
			Account Management
		</p>
		<h1 class="text-2xl font-extrabold tracking-tight text-[#1a1c1f]">
			Account
		</h1>
	</div>

	<!-- Personal details -->
	<div class="flex flex-col gap-4">
		<h2 class="text-lg font-semibold text-[#1a1c1f]">Personal details</h2>
		<div
			class="rounded-lg border border-[#e2e8f0] bg-white p-6 flex flex-col gap-5"
		>
			<div class="grid gap-5 sm:grid-cols-2">
				<div class="flex flex-col gap-1">
					<p
						class="text-[10px] font-bold uppercase tracking-wider text-[#94a3b8]"
					>
						Username
					</p>
					<p class="text-sm font-medium text-[#1a1c1f]">{user?.username}</p>
				</div>

				<div class="flex flex-col gap-1">
					<p
						class="text-[10px] font-bold uppercase tracking-wider text-[#94a3b8]"
					>
						Email
					</p>
					<div class="flex flex-wrap items-center gap-2">
						<p class="text-sm font-medium text-[#1a1c1f]">{user?.email}</p>
						{#if user?.is_verified}
							<Badge variant="secondary">Verified</Badge>
						{:else}
							<Badge variant="outline">Unverified</Badge>
						{/if}
					</div>
					{#if !user?.is_verified}
						<form
							method="POST"
							action="?/resendVerification"
							use:enhance
							class="mt-1"
						>
							<Button type="submit" variant="link" class="h-auto p-0 text-sm">
								Verify email
							</Button>
						</form>
						{#if form?.success}
							<p class="text-sm text-[#0369a1]">
								Check your inbox for a verification link.
							</p>
						{:else if form?.error}
							<p class="text-sm text-destructive">{form.error}</p>
						{/if}
					{/if}
				</div>

				<div class="flex flex-col gap-1">
					<p
						class="text-[10px] font-bold uppercase tracking-wider text-[#94a3b8]"
					>
						Member since
					</p>
					<p class="text-sm font-medium text-[#1a1c1f]">
						{user?.created_at ? formatPortfolioDateLocal(user.created_at) : '—'}
					</p>
				</div>
			</div>
		</div>
	</div>

	<!-- Subscription -->
	<div class="flex flex-col gap-4">
		<h2 class="text-lg font-semibold text-[#1a1c1f]">Subscription</h2>
		<div
			class="rounded-lg border border-[#e2e8f0] bg-white p-6 flex flex-col gap-5"
		>
			<div class="grid gap-5 sm:grid-cols-3">
				<div class="flex flex-col gap-1">
					<p
						class="text-[10px] font-bold uppercase tracking-wider text-[#94a3b8]"
					>
						Plan
					</p>
					<p class="text-sm font-medium text-[#1a1c1f]">{planDisplayName}</p>
				</div>

				<div class="flex flex-col gap-1">
					<p
						class="text-[10px] font-bold uppercase tracking-wider text-[#94a3b8]"
					>
						Cost
					</p>
					<p class="text-sm font-medium text-[#1a1c1f]">{subscriptionCost}</p>
				</div>

				<div class="flex flex-col gap-1">
					<p
						class="text-[10px] font-bold uppercase tracking-wider text-[#94a3b8]"
					>
						{expirationCaption}
					</p>
					<p class="text-sm font-medium text-[#1a1c1f]">{expirationLabel}</p>
				</div>
			</div>

			<div class="flex flex-wrap gap-3 pt-1">
				<Button variant="outline" disabled title="Coming soon"
					>Change plan</Button
				>
				{#if isPaidPlan}
					<Button variant="ghost" disabled title="Coming soon"
						>Unsubscribe</Button
					>
				{/if}
			</div>
		</div>
	</div>

	<!-- Billing history -->
	<div class="flex flex-col gap-4">
		<h2 class="text-lg font-semibold text-[#1a1c1f]">Billing history</h2>

		{#if invoices.length === 0}
			<EmptyState message="No billing history yet" />
		{:else}
			<div
				class="rounded-lg border border-[#e2e8f0] overflow-auto max-h-[400px]"
			>
				<table class="w-full text-sm table-fixed">
					<thead class="bg-[#f8fafc]">
						<tr>
							<th
								class="w-[160px] text-left px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-[#4c6076]"
							>
								Date
							</th>
							<th
								class="w-[120px] text-left px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-[#4c6076]"
							>
								Description
							</th>
							<th
								class="w-[120px] text-left px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-[#4c6076]"
							>
								Amount
							</th>
							<th
								class="w-[120px] text-left px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-[#4c6076]"
							>
								Status
							</th>
							<th
								class="w-[100px] text-left px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-[#4c6076]"
							>
								Receipt
							</th>
						</tr>
					</thead>
					<tbody>
						{#each invoices as invoice (invoice.id)}
							<tr class="border-t border-[#f3f3f7] hover:bg-[#f9f9fd]">
								<td class="px-4 py-3 text-[#1a1c1f]">
									{formatInvoiceDate(invoice.created_at)}
								</td>
								<td class="px-4 py-3 text-[#64748b]">
									{formatBillingReason(invoice.billing_reason)}
								</td>
								<td class="px-4 py-3 text-[#1a1c1f] font-medium">
									{invoice.total_formatted ?? '—'}
								</td>
								<td class="px-4 py-3">
									<span
										class="text-xs font-semibold text-[#64748b] bg-[#f3f3f7] px-2 py-0.5 rounded"
									>
										{formatStatus(invoice.status)}
									</span>
								</td>
								<td class="px-4 py-3">
									{#if invoice.urls?.invoice_url}
										<a
											href={invoice.urls.invoice_url}
											target="_blank"
											rel="noopener noreferrer"
											class="text-sm text-[#0369a1] hover:underline"
										>
											View
										</a>
									{:else}
										<span class="text-[#94a3b8]">—</span>
									{/if}
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}
	</div>
</section>
