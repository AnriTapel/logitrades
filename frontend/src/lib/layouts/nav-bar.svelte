<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import {
		Root as DropdownMenuRoot,
		Trigger as DropdownMenuTrigger,
		Content as DropdownMenuContent,
		Item as DropdownMenuItem,
		Label as DropdownMenuLabel,
	} from '$lib/components/ui/dropdown-menu';
	import { Sheet, SheetContent, SheetTrigger } from '$lib/components/ui/sheet';
	import Menu from 'lucide-svelte/icons/menu';
	import type { User } from '$lib/stores/auth';
	import SidebarNavContent from './sidebar-nav-content.svelte';

	let mobileMenuOpen = $state(false);

	const { userState } = $props<{ userState: User | null }>();

	function closeMobileMenu() {
		mobileMenuOpen = false;
	}
</script>

<header
	class="sticky top-0 z-20 h-16 border-b border-[#e2e8f0]/50 bg-white/80 backdrop-blur-sm shadow-sm"
>
	<div
		class="flex h-full items-center justify-between px-4 sm:px-8 max-w-[1600px] mx-auto"
	>
		{#if userState}
			<!-- Mobile: logo + title -->
			<a href="/journal" class="flex items-center gap-2 shrink-0 lg:hidden">
				<img src="/logo.svg" alt="LogiTrades" class="h-10 w-10" />
				<span class="text-lg font-bold text-[#24567f]">LogiTrades</span>
			</a>

			<!-- Desktop: spacer -->
			<div class="hidden lg:block flex-1"></div>

			<div class="flex items-center gap-2 shrink-0">
				<!-- Mobile hamburger -->
				<Sheet bind:open={mobileMenuOpen}>
					<SheetTrigger>
						<Button variant="outline" size="icon" class="lg:hidden">
							<Menu class="h-5 w-5" />
							<span class="sr-only">Open menu</span>
						</Button>
					</SheetTrigger>
					<SheetContent
						side="right"
						class="w-[280px] sm:w-[300px] p-4 flex flex-col"
					>
						<a
							href="/journal"
							class="flex items-center gap-2 shrink-0 mb-6"
							onclick={closeMobileMenu}
						>
							<img src="/logo.svg" alt="LogiTrades" class="h-10 w-10" />
							<span class="text-lg font-bold text-[#24567f]">LogiTrades</span>
						</a>
						<SidebarNavContent
							showLogout
							onNavigate={closeMobileMenu}
							class="flex-1"
						/>
					</SheetContent>
				</Sheet>

				<!-- Desktop: avatar dropdown -->
				<div class="hidden lg:block">
					<DropdownMenuRoot>
						<DropdownMenuTrigger>
							<Button variant="outline" class="rounded-xl h-8 w-8 p-0">
								<span class="text-sm font-semibold">
									{userState.username.charAt(0).toUpperCase()}
								</span>
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end">
							<DropdownMenuLabel>{userState.username}</DropdownMenuLabel>
							<DropdownMenuItem>
								<form action="/?/logout" method="POST">
									<Button type="submit" variant="link" class="p-0 h-auto">
										Logout
									</Button>
								</form>
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenuRoot>
				</div>
			</div>
		{:else}
			<a href="/" class="flex items-center gap-2 shrink-0">
				<img src="/logo.svg" alt="LogiTrades" class="h-10 w-10" />
				<span class="text-lg font-bold text-[#24567f]">LogiTrades</span>
			</a>
			<a href="/login">
				<Button variant="outline">Login</Button>
			</a>
		{/if}
	</div>
</header>
