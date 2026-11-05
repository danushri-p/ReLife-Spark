const knowledgeArticles = [
    {
        id: 'battery-safety',
        title: 'Battery Safety & Replacement',
        source: 'Apple Self Service Repair Manual',
        page: 'Battery Removal & Safety',
        tags: ['battery', 'safety', 'charging', 'swollen', 'repair'],
        summary: 'Follow battery handling and safety steps when diagnosing a swelling or charging issue.',
        content: 'For swollen, overheating, or rapid-draining batteries, stop using the device and avoid puncturing the battery pack. Use approved replacement parts, discharge the phone to a safe handling level before opening, and ensure the replacement battery is compatible with the exact model. Re-check charging behavior and verify the housing and adhesive seal are correctly reassembled.',
    },
    {
        id: 'display-repair',
        title: 'Display and Digitizer Repair',
        source: 'OEM Display Service Guide',
        page: 'Screen Replacement Checklist',
        tags: ['screen', 'display', 'digitizer', 'lcd', 'oled'],
        summary: 'Verify display compatibility, adhesive seal, and calibration after screen replacement.',
        content: 'Display replacements should verify the OEM-compatible panel, correct digitizer or touch sensor pairing, and any required serial or chip transfer. Unsealed or misaligned screens can lead to touch drift, moisture ingress, and poor brightness. After installation, confirm the display calibration, TrueTone, and brightness output match the original device behavior.',
    },
    {
        id: 'water-damage',
        title: 'Liquid Damage & Corrosion',
        source: 'Smartphone Service Standards Summary',
        page: 'Liquid Ingress & Board Cleaning',
        tags: ['water', 'liquid', 'corrosion', 'charging port', 'moisture'],
        summary: 'Check whether corrosion is localized and whether board-level cleaning or a sub-board replacement is appropriate.',
        content: 'If a phone has liquid damage, inspect the charging port, audio flex, and board connectors for corrosion or residue. Localized damage can sometimes be repaired by cleaning the board and replacing the affected connector or daughterboard. If corrosion has reached the logic board or spread under the shielding, complete board replacement may be the safer repair path.',
    },
    {
        id: 'warranty-rights',
        title: 'Warranty, Repair Rights & Consumer Guidance',
        source: 'FTC Repair Rights Overview',
        page: 'Independent Servicing Guidelines',
        tags: ['warranty', 'rights', 'consumer', 'repair', 'independent'],
        summary: 'Know what is covered by a warranty and what to ask a shop before authorizing repair work.',
        content: 'A standard warranty commonly excludes accidental damage and liquid ingress. Independent repair shops may still be allowed to service devices, but user rights depend on the device, the warranty terms, and whether repairs affect the original integrity of the product. Ask for exact parts used, labor warranty, and proof of any calibration or sealing work before approving the repair.',
    },
    {
        id: 'repair-vs-replace',
        title: 'Repair vs Replacement Decision',
        source: 'ReLife-Spark Value Assessment',
        page: 'Cost and Sustainability Guidance',
        tags: ['value', 'replace', 'repair', 'cost', 'sustainability'],
        summary: 'Compare repair cost to replacement price and device age before choosing a repair.',
        content: 'If the repair cost is a large share of the replacement price, especially on older devices, replacement may be the better decision. For newer devices with active warranty or good residual value, repair can be economically sensible. In all cases, compare the repair quote, replacement cost, and future reliability before deciding.',
    },
];

const normalize = (text = '') =>
    String(text)
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

const tokenize = (text = '') => {
    const normalized = normalize(text);
    return normalized ? normalized.split(' ').filter(Boolean) : [];
};

const scoreArticle = (article, query) => {
    const queryTokens = new Set(tokenize(query));
    if (!queryTokens.size) return 0;

    const titleTokens = tokenize(article.title);
    const tagTokens = tokenize(article.tags.join(' '));
    const contentTokens = tokenize(article.content);
    const summaryTokens = tokenize(article.summary);

    let score = 0;

    for (const token of queryTokens) {
        if (titleTokens.includes(token)) score += 6;
        if (tagTokens.includes(token)) score += 4;
        if (summaryTokens.includes(token)) score += 2;
        if (contentTokens.includes(token)) score += 1;
    }

    const phraseWeight = query.includes('battery') && article.tags.includes('battery') ? 2 : 0;
    const safetyWeight = query.includes('warranty') && article.tags.includes('warranty') ? 2 : 0;

    return score + phraseWeight + safetyWeight;
};

export const getKnowledgeCatalog = () =>
    knowledgeArticles.map((article) => ({
        id: article.id,
        title: article.title,
        source: article.source,
        page: article.page,
        tags: article.tags,
        summary: article.summary,
    }));

export const searchKnowledgeBase = (query, limit = 3) => {
    const rawQuery = String(query || '').trim();
    if (!rawQuery) {
        return knowledgeArticles.slice(0, Math.min(limit, knowledgeArticles.length)).map((article) => ({
            ...article,
            relevance: 1,
        }));
    }

    return knowledgeArticles
        .map((article) => ({
            ...article,
            relevance: scoreArticle(article, rawQuery),
        }))
        .filter((article) => article.relevance > 0)
        .sort((a, b) => b.relevance - a.relevance)
        .slice(0, Math.min(limit, knowledgeArticles.length));
};

export const buildKnowledgeContext = (query, limit = 3) =>
    searchKnowledgeBase(query, limit)
        .map((article) => `Title: ${article.title}\nSource: ${article.source} (${article.page})\nSummary: ${article.summary}\nContent: ${article.content}`)
        .join('\n\n');

export default {
    knowledgeArticles,
    getKnowledgeCatalog,
    searchKnowledgeBase,
    buildKnowledgeContext,
};
