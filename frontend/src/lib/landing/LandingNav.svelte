<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import {
		Sheet,
		SheetContent,
		SheetHeader,
		SheetTitle,
		SheetTrigger,
	} from '$lib/components/ui/sheet';
	import Menu from 'lucide-svelte/icons/menu';
	import BarChart2 from 'lucide-svelte/icons/bar-chart-2';
	import Tag from 'lucide-svelte/icons/tag';
	import ShieldCheck from 'lucide-svelte/icons/shield-check';
	import HelpCircle from 'lucide-svelte/icons/help-circle';

	let { isAuthenticated = false }: { isAuthenticated?: boolean } = $props();
	let isMenuOpen = $state(false);

	const navLinks = [
		{ href: '#features', label: 'Features', icon: BarChart2 },
		{ href: '#pricing', label: 'Pricing', icon: Tag },
		{ href: '#security', label: 'Security', icon: ShieldCheck },
		{ href: '#faq', label: 'FAQ', icon: HelpCircle },
	];
</script>

<header
	class="fixed left-0 top-0 z-20 w-full border-b border-border/20 bg-card/80 backdrop-blur"
>
	<div
		class="mx-auto flex w-full max-w-[1280px] items-center justify-between px-6 py-4"
	>
		<a
			href={isAuthenticated ? '/journal' : '/'}
			class="text-2xl font-extrabold tracking-tight text-primary"
		>
			LogiTrades
		</a>
		<nav class="hidden items-center gap-8 lg:flex">
			<a href="#features" class="text-sm font-semibold text-muted-foreground"
				>Features</a
			>
			<a href="#pricing" class="text-sm font-semibold text-muted-foreground"
				>Pricing</a
			>
			<a href="#faq" class="text-sm font-semibold text-muted-foreground">FAQ</a>
		</nav>
		<div class="flex items-center gap-4">
			<a
				href="/login"
				class="hidden text-sm font-semibold text-muted-foreground lg:inline-flex"
				>Login</a
			>
			<Button
				href="/signup"
				class="h-9 rounded-xl px-4 text-sm font-semibold lg:rounded"
			>
				Start Free Trial
			</Button>
			<Sheet bind:open={isMenuOpen}>
				<SheetTrigger>
					<Button
						variant="ghost"
						size="icon"
						class="h-9 w-9 text-primary lg:hidden"
					>
						<Menu class="h-5 w-5" />
						<span class="sr-only">Open navigation menu</span>
					</Button>
				</SheetTrigger>
				<SheetContent side="right" class="flex w-[300px] flex-col p-0">
					<!-- Header -->
					<SheetHeader class="border-b border-border/40 px-6 py-5">
						<SheetTitle class="text-left text-xl font-extrabold tracking-tight text-primary">
							LogiTrades
						</SheetTitle>
						<p class="text-left text-xs text-muted-foreground">Trading journal & analytics</p>
					</SheetHeader>

					<!-- Nav links -->
					<nav class="flex flex-1 flex-col gap-1 px-3 py-4">
						{#each navLinks as link}
							<a
								href={link.href}
								class="flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium text-foreground/80 transition-colors hover:bg-muted hover:text-foreground"
								onclick={() => (isMenuOpen = false)}
							>
								<span class="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
									<link.icon class="h-4 w-4" />
								</span>
								{link.label}
							</a>
						{/each}
					</nav>

					<!-- Footer CTA -->
					<div class="border-t border-border/40 px-6 py-5 flex flex-col gap-3">
						<Button
							href="/signup"
							class="w-full font-semibold"
							onclick={() => (isMenuOpen = false)}
						>
							Start Free Trial
						</Button>
						<a
							href="/login"
							class="text-center text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
							onclick={() => (isMenuOpen = false)}
						>
							Already have an account? <span class="text-primary underline-offset-2 hover:underline">Log in</span>
						</a>
					</div>
				</SheetContent>
			</Sheet>
		</div>
	</div>
</header>
