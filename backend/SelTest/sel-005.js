const {
  BASE_URL,
  By,
  assert,
  buildChromeDriver,
  fail,
  getCurrentPath,
  getLocalStorageValue,
  pass,
  until,
} = require("./seleniumTestUtils");
 
const TEST_ID = "SEL-005";
 
async function run() {
  const driver = await buildChromeDriver();
 
  try {
    await driver.get(`${BASE_URL}/login`);
 
    const emailInput = await driver.wait(until.elementLocated(By.id("email")), 10000);
    const passwordInput = await driver.findElement(By.id("password"));
    const loginButton = await driver.findElement(
      By.xpath("//button[@type='submit' and normalize-space()='Login']"),
    );
 
    await emailInput.sendKeys(`invalid.patient.${Date.now()}@example.com`);
    await passwordInput.sendKeys("WrongPassword123!");
    await loginButton.click();
 
    const errorMessage = await driver.wait(
      until.elementLocated(By.css("p.text-red-600")),
      10000,
    );
    await driver.wait(until.elementIsVisible(errorMessage), 10000);
 
    const errorText = await errorMessage.getText();
    const currentPath = await getCurrentPath(driver);
    const accessToken = await getLocalStorageValue(driver, "accessToken");
 
    assert.equal(currentPath, "/login", "Invalid login should remain on /login.");
    assert.ok(errorText.length > 0, "Invalid login should display an error message.");
    assert.equal(accessToken, null, "Invalid login should not store an access token.");
 
    pass(TEST_ID, "Invalid login was rejected and an error message was displayed.");
  } finally {
    await driver.quit();
  }
}
 
run().catch((error) => fail(TEST_ID, error));