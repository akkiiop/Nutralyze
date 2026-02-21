import fetch from 'node-fetch';

const userId = "6978666523d2d6d7c3d12210"; // From user logs
const url = "http://localhost:8080/api/meals/detected";

const payload = {
    userId: userId,
    mealType: "lunch",
    foodName: "Test Apple",
    nutrition: {
        calories: 95,
        protein: 0.5,
        carbs: 25,
        fats: 0.3,
        sugar: 19,
        fiber: 4
    },
    timestamp: new Date().toISOString()
};

console.log("Sending payload:", JSON.stringify(payload, null, 2));

try {
    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    const data = await res.json();
    console.log("Status:", res.status);
    console.log("Response:", JSON.stringify(data, null, 2));
} catch (err) {
    console.error("Request failed:", err);
}
