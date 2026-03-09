export function clientLazyLoad(element: HTMLImageElement, src: string) {
	const observer = new IntersectionObserver((entries) => {
		if (entries[0].isIntersecting) {
			element.src = src;
			observer.unobserve(element);
		}
	});

	observer.observe(element);

	return {
		destroy() {
			observer.unobserve(element);
		},
		update(src: string) {
			element.src = src;
		},
	};
}
