// Usamos el fetch nativo de Node.js v18+

const API_BASE_URL = 'https://alcanciapp-api.fliaprince.workers.dev';

async function testApi() {
    console.log("=== INICIANDO VALIDACIÓN BACKEND (ONLINE) ===");

    // 1. Registro Anonimo
    console.log("- POST /api/v1/auth/anonymous");
    const regRes = await fetch(`${API_BASE_URL}/api/v1/auth/anonymous`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
    });
    const regData = await regRes.json();
    if (!regData.ok) throw new Error("Registro falló: " + JSON.stringify(regData));
    const token = regData.token;
    console.log("✔ Registro Anónimo y Login exitoso");

    // 2. Crear Goal con target_amount
    console.log("- POST /api/v1/goals");
    const createGoalRes = await fetch(`${API_BASE_URL}/api/v1/goals`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
            name: "Comprar Laptop",
            duration_months: 6,
            frequency: "Mensual",
            privacy: "Privada",
            targetAmount: 35000 // Test de parametro
        })
    });
    const createData = await createGoalRes.json();
    if (!createData.ok || createData.goal.target_amount !== 35000) {
        throw new Error("POST Goal falló o no aceptó target_amount: " + JSON.stringify(createData));
    }
    const goalId = createData.goal.id;
    console.log("✔ POST /api/v1/goals acepta y devuelve target_amount: 35000");

    // 3. GET Goals (Lista)
    console.log("- GET /api/v1/goals");
    const getListRes = await fetch(`${API_BASE_URL}/api/v1/goals`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const listData = await getListRes.json();
    const fetchedGoal = listData.goals.find(g => g.id === goalId);
    if (!fetchedGoal || fetchedGoal.target_amount !== 35000 || fetchedGoal.total_saved !== 0) {
        throw new Error("GET /api/v1/goals (listado) falló o los campos son incorrectos: " + JSON.stringify(fetchedGoal));
    }
    console.log("✔ GET /api/v1/goals devuelve target_amount y total_saved = 0");

    // 4. Agregar Aportes
    console.log("- POST /api/v1/goals/:id/transactions");
    const txRes1 = await fetch(`${API_BASE_URL}/api/v1/goals/${goalId}/transactions`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ amount: 5000 })
    });
    const txData1 = await txRes1.json();
    if (!txData1.ok) throw new Error("Fallo tx1: " + JSON.stringify(txData1));

    const txRes2 = await fetch(`${API_BASE_URL}/api/v1/goals/${goalId}/transactions`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ amount: 15000 })
    });
    const txData2 = await txRes2.json();
    if (!txData2.ok) throw new Error("Fallo tx2: " + JSON.stringify(txData2));

    console.log("✔ Aportes realizados (5000 y 15000, Total = 20000)");

    // 5. GET Goal Detail
    console.log("- GET /api/v1/goals/:id");
    const getDetailRes = await fetch(`${API_BASE_URL}/api/v1/goals/${goalId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const detailData = await getDetailRes.json();
    if (!detailData.ok || detailData.goal.target_amount !== 35000 || detailData.goal.total_saved !== 20000) {
        throw new Error("GET detail devolvió datos incorrectos: " + JSON.stringify(detailData.goal));
    }
    console.log("✔ GET /api/v1/goals/:id devuelve target_amount = 35000 y total_saved = 20000 actualizado");

    console.log("=== TESTS API CODESPACES APROBADOS ===");
}

testApi().catch(err => {
    console.error("ERROR EN TEST:", err.message);
    process.exit(1);
});
