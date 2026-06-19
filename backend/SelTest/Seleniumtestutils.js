
const assert = require("node:assert/strict");
const { Builder, By, until } = require("selenium-webdriver");
const chrome = require("selenium-webdriver/chrome");
 
// URL-të
const BASE_URL = process.env.BASE_URL || "http://localhost:5174"; // frontend (React)
const API_BASE_URL = process.env.API_BASE_URL || "http://localhost:5000"; // backend (Node/Express)
const HEADLESS = process.env.HEADLESS === "true";
 
// ---------- Ndërtimi i driver-it të Chrome ----------
async function buildChromeDriver() {
  const options = new chrome.Options().addArguments("--window-size=1440,1000");
  if (HEADLESS) {
    options.addArguments("--headless=new");
  }
  return new Builder().forBrowser("chrome").setChromeOptions(options).build();
}
 
// ---------- Ndihmës për browser-in ----------
async function getCurrentPath(driver) {
  return driver.executeScript("return window.location.pathname;");
}
 
async function getLocalStorageValue(driver, key) {
  return driver.executeScript(
    "return window.localStorage.getItem(arguments[0]);",
    key
  );
}
 
// ---------- Email unik ----------
function uniqueEmail(prefix = "selenium.patient") {
  return `${prefix}.${Date.now()}.${Math.floor(Math.random() * 10000)}@example.com`;
}
 
// ---------- Kërkesë te API-ja (backend) ----------
async function apiRequest(path, options = {}) {
  const url = path.startsWith("http") ? path : `${API_BASE_URL}${path}`;
  const response = await fetch(url, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options,
  });
  const text = await response.text();
  let body = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }
  if (!response.ok) {
    throw new Error(`API ${path} failed: ${response.status} ${text}`);
  }
  return body;
}
 
// ---------- Krijon një llogari pacienti përmes API-së ----------
async function createPatientAccount(prefix = "selenium.patient") {
  const email = uniqueEmail(prefix);
  const password = "Patient1234!";
  const name = "Selenium Patient";
  await apiRequest("/api/auth/signup", {
    method: "POST",
    body: JSON.stringify({ name, email, password }),
  });
  return { name, email, password };
}
 
// ---------- Krijon pacient dhe logohet me të përmes UI ----------
async function loginAsGeneratedPatient(driver) {
  const account = await createPatientAccount();
 
  await driver.get(`${BASE_URL}/login`);
  const emailInput = await driver.wait(until.elementLocated(By.id("email")), 10000);
  await driver.wait(until.elementIsVisible(emailInput), 10000);
  const passwordInput = await driver.findElement(By.id("password"));
  const loginButton = await driver.findElement(
    By.xpath("//button[@type='submit' and normalize-space()='Login']")
  );
 
  await emailInput.clear();
  await emailInput.sendKeys(account.email);
  await passwordInput.clear();
  await passwordInput.sendKeys(account.password);
  await loginButton.click();
 
  // Prit derisa të ruhet access token (login i kryer)
  await driver.wait(
    async () => (await getLocalStorageValue(driver, "accessToken")) !== null,
    15000
  );
 
  return account;
}
 
// ---------- Raportim rezultati ----------
function pass(testId, message) {
  console.log(`${testId} PASSED: ${message}`);
}
 
function fail(testId, error) {
  console.error(`${testId} FAILED`);
  console.error(error);
  process.exit(1);
}
 
module.exports = {
  // Variabla
  BASE_URL,
  API_BASE_URL,
  // Ri-eksporte nga selenium-webdriver / node
  By,
  until,
  assert,
  // Funksione
  buildChromeDriver,
  getCurrentPath,
  getLocalStorageValue,
  uniqueEmail,
  apiRequest,
  createPatientAccount,
  loginAsGeneratedPatient,
  pass,
  fail,
};