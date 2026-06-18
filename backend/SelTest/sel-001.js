// ============================================================
// SEL-001: Patient (user) logs in with valid credentials
// ============================================================
// Si ekzekutohet:
//   1. Nis backend-in dhe frontend-in (duhet të jenë gjallë)
//   2. Cakto kredencialet:
//        PowerShell:  $env:PATIENT_EMAIL="..."; $env:PATIENT_PASSWORD="..."
//   3. node sel-001.js
// ============================================================
 
const assert = require("node:assert/strict");
const { Builder, By, until } = require("selenium-webdriver");
const chrome = require("selenium-webdriver/chrome");
 
// Frontend-i React (parazgjedhje 5173). Backend-i është diku tjetër (5000).
const BASE_URL = process.env.BASE_URL || "http://localhost:5173";
const PATIENT_EMAIL = process.env.PATIENT_EMAIL;
const PATIENT_PASSWORD = process.env.PATIENT_PASSWORD;
const HEADLESS = process.env.HEADLESS === "true";
 
// Siguron që kredencialet janë dhënë para se të fillojë testi
function requireCredential(value, name) {
  if (!value || value.trim() === "") {
    throw new Error(`Mungon variabla e mjedisit: ${name}`);
  }
}
 
// Lexon një vlerë nga localStorage i browser-it
async function getLocalStorageValue(driver, key) {
  return driver.executeScript(
    "return window.localStorage.getItem(arguments[0]);",
    key
  );
}
 
// Kthen rrugën aktuale të URL-së (p.sh. "/", "/login")
async function getCurrentPath(driver) {
  return driver.executeScript("return window.location.pathname;");
}
 
async function runSel001PatientLoginTest() {
  requireCredential(PATIENT_EMAIL, "PATIENT_EMAIL");
  requireCredential(PATIENT_PASSWORD, "PATIENT_PASSWORD");
 
  const options = new chrome.Options().addArguments("--window-size=1440,1000");
  if (HEADLESS) {
    options.addArguments("--headless=new");
  }
 
  const driver = await new Builder()
    .forBrowser("chrome")
    .setChromeOptions(options)
    .build();
 
  try {
    // 1. Hap faqen e login-it
    await driver.get(`${BASE_URL}/login`);
 
    // 2. Gjej fushat dhe butonin
    const emailInput = await driver.wait(
      until.elementLocated(By.id("email")),
      10000
    );
    await driver.wait(until.elementIsVisible(emailInput), 10000);
    const passwordInput = await driver.findElement(By.id("password"));
    const loginButton = await driver.findElement(
      By.xpath("//button[@type='submit' and normalize-space()='Login']")
    );
 
    // 3. Shkruaj kredencialet dhe kliko Login
    await emailInput.clear();
    await emailInput.sendKeys(PATIENT_EMAIL);
    await passwordInput.clear();
    await passwordInput.sendKeys(PATIENT_PASSWORD);
    await loginButton.click();
 
    // 4. Prit derisa të ridrejtohet te "/" dhe role të jetë "user"
    await driver.wait(async () => (await getCurrentPath(driver)) === "/", 15000);
    await driver.wait(
      async () => (await getLocalStorageValue(driver, "role")) === "user",
      15000
    );
 
    // 5. Verifiko rezultatet
    const currentPath = await getCurrentPath(driver);
    const role = await getLocalStorageValue(driver, "role");
    const accessToken = await getLocalStorageValue(driver, "accessToken");
    const currentUrl = await driver.getCurrentUrl();
 
    assert.equal(currentPath, "/", "Pacienti duhet të ridrejtohet te faqja kryesore.");
    assert.equal(role, "user", "Roli i llogarisë duhet të jetë 'user'.");
    assert.ok(accessToken, "Login duhet të ruajë një access token në localStorage.");
    assert.equal(
      currentUrl.includes("/login"),
      false,
      "Përdoruesi nuk duhet të jetë më te faqja e login-it."
    );
 
    console.log("SEL-001 PASSED: Patient user logged in successfully.");
  } finally {
    await driver.quit();
  }
}
 
runSel001PatientLoginTest().catch((error) => {
  console.error("SEL-001 FAILED");
  console.error(error);
  process.exit(1);
});
 