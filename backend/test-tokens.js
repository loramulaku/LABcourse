const fetch = require("node-fetch");
const API_URL = "http://localhost:5000";

async function testTokens() {
  try {
    // 1️⃣ Login
    const loginRes = await fetch(`${API_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "test@example.com", password: "123456" })
    });

    const loginData = await loginRes.json();
    console.log("Login Response:", loginData);
    if (loginData.error) return console.error("Login Error:", loginData.error);

    const accessToken = loginData.accessToken;
    const role = loginData.role;
    console.log("Access Token:", accessToken);
    console.log("Role:", role);

    // 2️⃣ Protected route
    const protectedRes = await fetch(`${API_URL}/api/auth/dashboard`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    const protectedData = await protectedRes.json();
    console.log("Protected Data:", protectedData);

    // 3️⃣ Refresh token → Pasi cookie nuk ekziston në Node, përdor DB token direkt
    // Në backend, refresh token gjendet në tabelën refresh_tokens
    // Për test, le të bëjmë fetch nga /refresh duke vendosur token manual
    // Këtu supozojmë që backend kthen gjithmonë access token të ri nga cookie ose token i dhënë

    const refreshToken = "tokeni_refresh_qe_ke_ne_DB"; // ndrysho me token të vërtetë

    const refreshRes = await fetch(`${API_URL}/api/auth/refresh`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Cookie": `refreshToken=${refreshToken}` // simulo cookie
      }
    });

    const refreshData = await refreshRes.json();
    console.log("New Access Token from Refresh:", refreshData.accessToken);

  } catch (error) {
    console.error("Error:", error.message);
  }
}

testTokens();