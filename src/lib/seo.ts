/**
 * SEO helper utilities
 */

const PUBLIC_SITE_URL = import.meta.env.PUBLIC_SITE_URL || '';

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
	const canonical = PUBLIC_SITE_URL ? `${PUBLIC_SITE_URL}${pathname}` : pathname;
	const ogImageUrl = ogImage 
		? (ogImage.startsWith('http') ? ogImage : `${PUBLIC_SITE_URL}${ogImage}`)
		: `${PUBLIC_SITE_URL}/og-image.png`;

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
 */
export const defaultHomeSeo = {
	title: "Gamification API for Digital Engagement at Scale | GameLayer",
	description: "GameLayer is a Gamification API platform that helps modern products add missions, streaks, rewards, and leaderboards. Launch engagement mechanics in days via API + dashboard.",
	pathname: "/"
};


