const fetch = require("node-fetch");
const API_URL = "http://localhost:5000";

async function testRefresh() {
  try {
    const refreshToken = "'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NCwiaWF0IjoxNzU2MjM2NTA1LCJleHAiOjE3NTYyMzY2ODV9.G6iCE9krGPZXFAOS-CEYCtIlJW5gf4jqFnR4uHsHDZ4'";

    // Simulo cookie për backend
    const refreshRes = await fetch(`${API_URL}/api/auth/refresh`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Cookie": `refreshToken=${refreshToken}` // backend do e lexojë me cookie-parser
      }
    });

    const refreshData = await refreshRes.json();
    console.log("New Access Token from Refresh:", refreshData.accessToken);

  } catch (error) {
    console.error("Error:", error.message);
  }
}

testRefresh();