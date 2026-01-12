
/**
 * Utility to parse and clean data from QR codes.
 * Standardizes prefixes like CAIXA: and GAIOLA:
 */
export function parseQRData(data: string): { id: string; type?: 'caixa' | 'gaiola' } {
    if (!data) return { id: '' };

    const trimmed = data.trim();

    // Handle Prefixes
    if (trimmed.startsWith('CAIXA:')) {
        return { id: trimmed.replace('CAIXA:', ''), type: 'caixa' };
    }

    if (trimmed.startsWith('GAIOLA:')) {
        return { id: trimmed.replace('GAIOLA:', ''), type: 'gaiola' };
    }

    // Handle JSON
    try {
        const parsed = JSON.parse(trimmed);
        if (parsed.id) return { id: parsed.id, type: parsed.type };
        if (parsed.cageId) return { id: parsed.cageId, type: 'gaiola' };
        if (parsed.groupId) return { id: parsed.groupId, type: 'gaiola' }; // Fallback
    } catch (e) {
        // Not JSON
    }

    // Return raw trimmed value as ID
    return { id: trimmed };
}
