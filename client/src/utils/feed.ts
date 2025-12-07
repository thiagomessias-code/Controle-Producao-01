// src/utils/feed.ts

/**
 * Compute the appropriate feed type based on group type, batch age, and override flag.
 *
 * @param groupType - The type/name of the group (e.g., "Crescimento", "Produtoras", "Machos").
 * @param birthDate - ISO string of the batch's birth date.
 * @param extendFeed - If true, keep the manually selected feed type.
 * @param manualFeedType - The currently selected feed type (used when extendFeed is true).
 * @returns The feed type string.
 */
export const computeFeedType = (
    groupType: string | undefined,
    birthDate: string | undefined,
    extendFeed: boolean,
    manualFeedType: string
): string => {
    if (extendFeed) return manualFeedType;
    if (!groupType) return manualFeedType;

    const lower = groupType.toLowerCase();
    // Male groups (Machos) always use Engorda
    if (lower.includes('macho')) return 'Engorda';
    // Production / Reproduction groups use Postura
    if (lower.includes('produtora') || lower.includes('reprodutora')) return 'Postura';

    // For growth boxes, determine by age in weeks
    if (!birthDate) return manualFeedType;
    const ageDays = (Date.now() - new Date(birthDate).getTime()) / (1000 * 60 * 60 * 24);
    const ageWeeks = Math.floor(ageDays / 7);

    if (ageWeeks < 2) return 'Inicial';
    if (ageWeeks < 5) return 'Crescimento';
    return 'Postura';
};
