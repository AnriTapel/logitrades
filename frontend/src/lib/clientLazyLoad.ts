export function clientLazyLoad(element: HTMLImageElement, src: string) {
	let currentSrc = src;
	let loaded = false;

	const load = () => {
		if (loaded && element.src === currentSrc) return;
		element.src = currentSrc;
		loaded = true;
	};

	const observer = new IntersectionObserver((entries) => {
		if (entries[0].isIntersecting) {
			load();
			observer.unobserve(element);
		}
	});

	observer.observe(element);

	return {
		destroy() {
			observer.disconnect();
		},
		update(nextSrc: string) {
			currentSrc = nextSrc;
			// If already visible/loaded, swap immediately so late hydrations
			// (e.g. currency store seed) don't leave a stale flag.
			if (loaded) {
				element.src = nextSrc;
			}
		},
	};
}
