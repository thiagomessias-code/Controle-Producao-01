// Fixed groups for the aviary system
// These are the only groups that should appear in registration forms

export const FIXED_GROUPS = [
    {
        id: 'produtoras',
        name: 'Produtoras',
        type: 'postura',
        description: 'Grupo de codornas produtoras de ovos'
    },
    {
        id: 'machos',
        name: 'Machos',
        type: 'males',
        description: 'Grupo de codornas machos para engorda'
    },
    {
        id: 'reprodutoras',
        name: 'Reprodutoras',
        type: 'breeders',
        description: 'Grupo de codornas reprodutoras'
    }
] as const;

export type FixedGroupId = typeof FIXED_GROUPS[number]['id'];
export type FixedGroupType = typeof FIXED_GROUPS[number]['type'];
