const {
  BASE_URL,
  By,
  assert,
  buildChromeDriver,
  fail,
  pass,
  uniqueEmail,
  until,
} = require("./seleniumTestUtils");
 
const TEST_ID = "SEL-006";
 
async function run() {
  const driver = await buildChromeDriver();
 
  try {
    const email = uniqueEmail("selenium.registration");
 
    await driver.get(`${BASE_URL}/login`);
 
    const signUpToggle = await driver.wait(
      until.elementLocated(By.xpath("//span[normalize-space()='Click here']")),
      10000,
    );
    await signUpToggle.click();
 
    await driver.wait(
      until.elementLocated(By.xpath("//h2[normalize-space()='Create Account']")),
      10000,
    );
 
    await driver.findElement(By.id("name")).sendKeys("Selenium Registration Patient");
    await driver.findElement(By.id("email")).sendKeys(email);
    await driver.findElement(By.id("password")).sendKeys("SeleniumPass123!");
 
    await driver.findElement(
      By.xpath("//button[@type='submit' and normalize-space()='Create Account']"),
    ).click();
 
    await driver.wait(
      until.elementLocated(By.xpath("//h2[normalize-space()='Login']")),
      10000,
    );
 
    const pageText = await driver.findElement(By.css("body")).getText();
 
    assert.ok(
      pageText.includes("Login"),
      "Successful patient registration should switch the form back to Login.",
    );
 
    pass(TEST_ID, `Patient registration succeeded for ${email}.`);
  } finally {
    await driver.quit();
  }
}
 
run().catch((error) => fail(TEST_ID, error));