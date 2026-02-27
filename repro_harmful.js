const test = async () => {
    const ingredients = [
        "Refined wheat flour",
        "Refined palm oil",
        "Sugar",
        "Invert sugar syrup",
        "Cashew",
        "Milk products",
        "Raising agents",
        "Iodised salt",
        "Emulsifiers",
        "Nature identical and artificial flavouring substances",
        "Maida",
        "Milk",
        "Butter",
        "503",
        "500",
        "322",
        "471",
        "472e",
        "Vanilla"
    ];

    try {
        console.log("Testing Harmful Ingredients API...");
        const res = await fetch("http://localhost:5000/api/harmful-ingredients", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ingredients })
        });

        console.log("Status:", res.status);
        const data = await res.json();

        console.log("Harmful Count:", data.harmful?.length);
        console.log("Frequency Level:", data.frequency_analysis?.level);
        console.log("\nHarmful Ingredients Detected (High Risk):");
        data.harmful?.forEach(h => {
            console.log(`- ${h.ingredient} (Risk: ${h.risk})`);
        });

        console.log("\nAll Analysis Results:");
        data.all?.forEach(h => {
            console.log(`- ${h.ingredient} (Label: ${h.label}, Risk: ${h.risk})`);
        });

        if (!data.harmful || data.harmful.length === 0) {
            console.log("\n❌ ERROR: No harmful ingredients detected! Something is wrong with the lookup or normalization.");
        } else {
            console.log("\n✅ Success: Harmful ingredients detected.");
        }
    } catch (err) {
        console.error("Test failed:", err.message);
    }
};

test();
