/**
 * Single source of truth for intentional external endpoints
 * These .co domain references are intentional and should not be changed
 */

export const EXTERNAL_URLS = {
	/** CMS Dashboard URL */
	CMS_DASHBOARD: 'https://app.gamelayer.co/',
} as const;

export const EXTERNAL_EMAILS = {
	/** General contact email */
	CONTACT: 'contact@gamelayer.co',
	/** Legal inquiries email */
	LEGAL: 'legal@gamelayer.co',
	/** Sales inquiries email */
	SALES: 'sales@gamelayer.co',
} as const;

export const EXTERNAL_SOCIAL = {
	/** LinkedIn company page URL */
	LINKEDIN: 'https://www.linkedin.com/company/gamelayer/',
	/** X (Twitter) profile URL */
	TWITTER: 'https://x.com/gamelayerco',
	/** Instagram profile URL */
	INSTAGRAM: 'https://www.instagram.com/gamelayer.co/',
} as const;
