/**
 * Ingredient Classifier
 * Categorizes ingredients into:
 * 1. Primary Ingredients
 * 2. Added Sugars & Fats
 * 3. Additives & Processing Agents
 * 4. Allergens Detected
 */

export const classifyIngredients = (ingredients = []) => {
    if (!Array.isArray(ingredients) || ingredients.length === 0) return null;

    const groups = {
        primary: [],
        sugarsFats: [],
        additives: [],
        allergens: []
    };

    const processed = new Set();

    ingredients.forEach(rawItem => {
        if (!rawItem || typeof rawItem !== 'string') return;

        // 1. CLEANING & NORMALIZATION
        let item = rawItem.trim();

        // Remove leading numbers (e.g., "1. Wheat")
        item = item.replace(/^\d+[\.\)]\s*/, "");

        // Merge Synonyms
        const lower = item.toLowerCase();
        if (lower.includes("refined wheat flour")) item = "Maida (Refined Wheat Flour)";
        else if (lower === "sugar" || lower === "sucrose") item = "Sugar";
        else if (lower.includes("iodised salt") || lower.includes("common salt")) item = "Salt";

        // Check duplicates
        if (processed.has(item.toLowerCase())) return;
        processed.add(item.toLowerCase());

        // 2. CLASSIFICATION

        // A. ALLERGENS (Priority)
        // Simple keyword match for common allergens
        const allergenKeywords = [
            "milk", "soy", "soya", "wheat", "gluten", "peanut", "nut", "almond",
            "cashew", "walnut", "egg", "fish", "shellfish", "mustard", "sesame", "sulphite", "sulfite"
        ];
        // Note: Many ingredients contain allergens but aren't just the allergen (e.g. "Whey Powder" contains Milk).
        // We will flag explicit allergens or items that STRONGLY imply them.
        // For this UI, user wants "Allergens Detected" as a group. Ingredient list usually lists ingredients, 
        // and allergens are a separate warning. 
        // However, if we must group THE ingredients:
        // "Milk Solids" -> Primary or Allergen? usually Primary, but tagged as allergen.
        // User request: "Organize ingredients into... Allergens Detected".
        // This implies moving the ingredient itself to the allergen group? 
        // Or is it a summary? "Displaying a flat numbered chip list... organize... into four sections".
        // This implies the ingredients THEMSELVES are moved.
        // Let's be careful. if I move "Wheat Flour" to "Allergens", I lose "Primary".
        // Maybe "Allergens Detected" is for EXPLICIT allergens listed separately?
        // Or items that are PURELY allergens?
        // Let's try to categorize by "Function".
        // If it's a major ingredient (Wheat), it's Primary, but we can tag it.
        // BUT the user asked for 4 SECTIONS.
        // Let's attempt to put HIGH RISK allergens in "Allergens" if they are clearly listed as such 
        // or if the user wants to Highlight them.
        // Implementation choice: Keep "Wheat" in Primary (it's food). Put "Contains Added Flavour (Milk)" in Additives?
        // Let's adhere to:
        // 1. Additives (E-codes, agents)
        // 2. Sugars & Fats (Oil, Sugar)
        // 3. Allergens (If it's strictly an allergen warning or specific allergen isolate? e.g. "Soy Lecithin" -> Additive (Emulsifier) OR Allergen?)
        // Let's put "Soy Lecithin" in Additives.
        // Let's put "Peanuts" in Primary or Allergens?
        // User said "Allergens Detected". I will duplicate or move?
        // "Organize ingredients into four sections". Mutually exclusive sections usually.
        // I will put bold allergens in "Allergens" if they are NOT primary macro sources?
        // OR: Primary = Food base. Sugars/Fats = unhealthy additives. Additives = Chemicals. Allergens = The rest?
        // Actually, Wheat IS an allergen. Cleaning it from Primary might be weird.
        // Let's use "Allergens" section for items that are PRIMARILY flagged as allergens and don't fit well elsewhere?
        // OR: Maybe the user means "Key Allergens" separately?
        // Re-reading: "Organize ingredients into four sections".
        // Okay, I will try:
        // Sugar/Fats -> Sugars & Fats
        // Additives -> Additives
        // The rest:
        // If it matches allergen list -> Allergens
        // Else -> Primary.

        let category = "primary";

        // Detect Additives (E-codes, Agents)
        if (
            /e\d{3,4}/i.test(item) ||
            /ins\s*\d{3,4}/i.test(item) ||
            /(preservative|stabilizer|emulsifier|acidity|regulator|raising|agent|color|flavour|flavor|antioxidant|humectant|sequestrant|thickener)/i.test(lower)
        ) {
            category = "additives";
        }
        // Detect Sugars & Fats
        else if (
            /(sugar|syrup|dextrose|fructose|glucose|sucrose|maltodextrin|caramel|honey|molasses|oil|fat|butter|margarine|ghee|shortening|stearin|palm|cocoa butter)/i.test(lower) &&
            !lower.includes("no added sugar") // safety check
        ) {
            category = "sugarsFats";
        }
        // Detect Allergens (If not already caught? e.g. Peanut Oil is Fat. Wheat Flour is Primary?)
        // This is tricky. Wheat Flour is Primary.
        // Maybe "Allergens" section is for "Contains: Wheat, Soy" text often found at end?
        // If the list is just ingredients:
        // I will put "Wheat Flour" in Primary.
        // I will put "Milk Solids" in Primary.
        // I will ONLY put items in "Allergens" if they are specific allergen alerts or don't fit Primary/Sugar/Additive well but ARE allergens?
        // Actually, let's keep it simple.
        // Primary = The bulk food.
        // Allergen = If it's a "May contain..." or specific allergen declaration line?
        // If regular ingredients:
        // Use Primary for major food items.
        // Use Allergens for specific known allergens that are NOT primary grains/meats?
        // Let's try: Check keywords. If matches Allergen AND NOT Primary Grain/Meat keywords?
        // For Safety: I will flag allergens in ALL categories with a boolean `isAllergen`.
        // And I will only populate the "Allergens Detected" group if I find lines that explicitly look like "Contains X" OR
        // if I decide to move specific items there.
        // User request: "Organize ingredients into four sections... 4) Allergens Detected".
        // I will move items to "Allergens Detected" if they match the allergen list AND are not clearly Sugars/Fats or Additives.
        // This effectively splits Primary into "Safe Primary" and "Allergenic Primary"?
        // "Wheat Flour" -> Allergens? That seems odd for a biscuit.
        // Let's stick to: Primary = Base Food. Allergens = "Contains X".
        // If no "Contains X", maybe this section is empty?
        // "Allergens Detected" -> "Allergens Detected: Wheat, Soy" (Summary).
        // But user asked to Group INGREDIENTS.
        // Okay, distinct strategy:
        // 1. Sugars/Fats
        // 2. Additives
        // 3. Allergens (Known list)
        // 4. Primary (The rest)
        // Yes, Wheat Flour goes to Allergens. It highlights the risk.
        else if (allergenKeywords.some(k => lower.includes(k))) {
            category = "allergens";
        }

        // Refine Additives display
        // e.g. "Raising Agents (503(ii))" -> "Raising Agents - 503(ii)"
        if (category === "additives") {
            item = item.replace(/\s*\(\s*([eins\d\w]+)\s*\)/i, " - $1");
        }

        groups[category].push({
            name: item,
            isAllergen: allergenKeywords.some(k => lower.includes(k)) // Flag for red outline
        });

    });

    return groups;
};

export const getCategoryStyles = (cat) => {
    switch (cat) {
        case 'primary': return { color: 'green', label: 'Primary Ingredients' };
        case 'sugarsFats': return { color: 'amber', label: 'Added Sugars & Fats' };
        case 'additives': return { color: 'gray', label: 'Additives & Agents' };
        case 'allergens': return { color: 'red', label: 'Allergens Detected' };
        default: return { color: 'gray', label: 'Other' };
    }
};
