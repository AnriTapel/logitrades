export const heroContent = {
	mobile: {
		badge: 'New Institutional Access',
		title: 'Master the markets with analytical sanctuary.',
		description:
			'Professional-grade trading journaling and execution analysis for retail traders seeking the institutional edge.',
		primaryCta: 'Start Free Trial',
		secondaryCta: 'View Live Demo',
	},
	desktop: {
		badge: 'The Analytical Sanctuary',
		titleStart: 'A trading journal for',
		titleHighlight: 'institutional-lite',
		titleEnd: 'professional trader',
		description:
			'Log trades, analyze performance, and refine your edge with precision. Not hype, just data.',
		primaryCta: 'Start Free Trial',
		secondaryCta: 'View Demo',
	},
} as const;

export const keyBenefits = {
	eyebrow: 'Built to deliver',
	items: [
		'Accurate PnL per trade',
		'Win rate & expectancy',
		'Setup pattern analysis',
		'Risk & drawdown metrics',
		'Full data portability',
	],
} as const;

export const featureItems = [
	{
		title: 'Institutional Analytics',
		description:
			'Deep-dive into trade psychology and execution metrics used by hedge fund desks.',
		icon: 'bar-chart-3',
		tileClass: 'bg-primary/15',
	},
	{
		title: 'Military-Grade Security',
		description:
			'End-to-end encryption for all your trade data and private API connections.',
		icon: 'shield-check',
		tileClass: 'bg-primary/20',
	},
	{
		title: 'Real-time Precision',
		description:
			'Automated imports from major brokers with millisecond accuracy.',
		icon: 'clock-3',
		tileClass: 'bg-muted',
	},
] as const;

export const steps = [
	{
		title: 'Connect Your Desk',
		description:
			'Securely sync your brokerage via encrypted API or manual CSV imports.',
	},
	{
		title: 'Execute & Record',
		description:
			'Trade naturally while LogiTrades captures every data point and emotion.',
	},
	{
		title: 'Analyze & Optimize',
		description:
			'Review institutional reports to find your edge and eliminate errors.',
	},
] as const;

export const desktopSteps = [
	{
		title: 'Log your trades',
		description:
			'Manually input execution details or sync directly with your broker via secure API integrations.',
	},
	{
		title: 'Analyze performance',
		description:
			'Use our deep filtering to identify your most profitable setups, best trading times, and asset strengths.',
	},
	{
		title: 'Improve your edge',
		description:
			"Refine your process based on cold, hard data. Cut what doesn't work and scale what does with confidence.",
	},
] as const;

export const desktopBentoFeatures = {
	eyebrow: 'Capabilities',
	title: 'Precision Primitives for Performance',
	tradeLogging: {
		title: 'Trade Logging',
		description:
			'Manual and automated entry for all asset classes. Support for multi-leg strategies and tiered exits.',
	},
	performanceAnalytics: {
		title: 'Performance Analytics',
		description:
			'Deep dive into PnL, win rate, and expectancy with institutional rigor.',
	},
	disciplineTracker: {
		title: 'Discipline Tracker',
		description:
			'Tag trades to identify psychological leaks. Track emotional state alongside execution.',
	},
	dataExport: {
		title: 'Data Import & Export',
		description:
			'Import your data from your existing trading journal or export it to your existing trading journal. Your data remains yours, always.',
	},
} as const;

export const pricingPlans = [
	{
		name: 'Free',
		price: '$0',
		cadence: '/mo',
		description: 'Ideal for testing the waters.',
		cta: 'Get Started',
		features: ['50 trades / month', 'Basic statistics', '1 exchange sync'],
		featured: false,
	},
	{
		name: 'Pro',
		price: '$29',
		cadence: '/mo',
		description: 'For serious retail traders.',
		cta: 'Start 14-Day Trial',
		features: [
			'Unlimited trades',
			'Psychological analytics',
			'All broker integrations',
			'Journal sharing',
		],
		featured: true,
	},
	{
		name: 'Institution',
		price: '$99',
		cadence: '/mo',
		description: 'For prop firms and groups.',
		cta: 'Contact Sales',
		features: [
			'Up to 5 traders',
			'Admin risk dashboard',
			'Priority 24/7 support',
		],
		featured: false,
	},
] as const;

export const desktopPricingPlans = [
	{
		name: 'Free',
		price: '$0',
		cadence: '/mo',
		description: 'For getting started.',
		cta: 'Get Started',
		features: ['Basic logging', '10 trades/month', 'Email support'],
		featured: false,
	},
	{
		name: 'Pro',
		price: '$29',
		cadence: '/mo',
		description: 'For serious individual traders.',
		cta: 'Start Free Trial',
		features: [
			'Unlimited trades',
			'Advanced analytics',
			'Automated broker sync',
			'Priority support',
		],
		featured: true,
	},
	{
		name: 'Team',
		price: '$99',
		cadence: '/mo',
		description: 'For desks and small teams.',
		cta: 'Contact Sales',
		features: ['Shared dashboards', 'Multi-user access', 'Role management'],
		featured: false,
	},
] as const;

export const faqs = [
	{
		question: 'Is my brokerage data safe?',
		answer:
			'Yes. We use secure transport and encrypted storage practices to protect account-level data.',
	},
	{
		question: 'Can I export my data?',
		answer:
			'Yes. You can export your journal records and analytics for off-platform analysis.',
	},
	{
		question: 'Do you support crypto?',
		answer:
			'Yes. The platform supports crypto workflows alongside equities and other markets.',
	},
] as const;

export const desktopFaqs = [
	{
		question: 'Is my data secure?',
		answer:
			'Your data is encrypted at rest and in transit. We treat institutional-level security as our baseline requirement.',
	},
	{
		question: 'Which exchanges are supported?',
		answer:
			'We provide native support for Stocks, Futures, FX, and Crypto markets worldwide.',
	},
	{
		question: 'Can I export my data?',
		answer:
			'Full data portability is guaranteed. Export your entire trade history anytime in CSV or JSON formats.',
	},
] as const;

export const deepDive = {
	title: 'Designed for Depth, Built for Clarity',
	description:
		'Our interface does not distract. It surfaces the metrics that matter for consistent execution and long-term profitability.',
	callouts: ['Equity Curve', 'Risk Management Stats', 'Journal Notes'],
} as const;

export const finalCta = {
	title: 'Ready to master your performance?',
	description:
		'Join the next generation of professional retail traders building their edge through data.',
	button: 'Start Your 14-Day Free Trial',
	disclaimer: 'No credit card required to start.',
} as const;
