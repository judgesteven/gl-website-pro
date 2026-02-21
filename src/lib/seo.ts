/**
 * SEO helper utilities
 */

// Ensure canonical URLs always use live domain (never localhost/staging)
const PUBLIC_SITE_URL = import.meta.env.PUBLIC_SITE_URL || 'https://gamelayer.io';
const LIVE_SITE_URL = 'https://gamelayer.io';

export interface SeoProps {
	title: string;
	description?: string;
	pathname?: string;
	ogImage?: string;
	noindex?: boolean;
	schemaExtras?: Array<Record<string, any>>;
}

export function buildSeo({
	title,
	description,
	pathname = '/',
	ogImage,
	noindex = false,
	schemaExtras = []
}: SeoProps) {
	// Ensure canonical always uses live domain (normalize pathname to remove trailing slash except for root)
	const normalizedPath = pathname === '/' ? '/' : pathname.replace(/\/$/, '');
	const canonical = `${LIVE_SITE_URL}${normalizedPath}`;
	const ogImageUrl = ogImage 
		? (ogImage.startsWith('http') ? ogImage : `${PUBLIC_SITE_URL}${ogImage}`)
		: `${PUBLIC_SITE_URL}/gamelayer-gamification-api-digital-engagement.png`;

	return {
		title,
		description: description || title,
		canonical,
		ogImage: ogImageUrl,
		noindex,
		schemaExtras
	};
}

/**
 * Default homepage SEO with "Gamification API" keyword
 * Optimized for full-funnel: Exec/Marketing (engagement/retention/loyalty) + Product (mechanics) + Technical (API)
 */
export const defaultHomeSeo = {
	title: "Gamification API for Digital Engagement, Loyalty & Retention | GameLayer",
	description: "GameLayer is a Gamification API for digital engagement, loyalty and retention. Launch missions, streaks, leaderboards, rewards and achievements in days—via a flexible REST API.",
	pathname: "/"
};


