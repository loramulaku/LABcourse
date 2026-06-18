const {
  BASE_URL,
  By,
  assert,
  buildChromeDriver,
  createPatientAccount,
  fail,
  pass,
  until,
} = require("./seleniumTestUtils");
 
const TEST_ID = "SEL-008";
 
async function run() {
  const existingPatient = await createPatientAccount("selenium.duplicate");
  const driver = await buildChromeDriver();
 
  try {
    await driver.get(`${BASE_URL}/login`);
 
    const signUpToggle = await driver.wait(
      until.elementLocated(By.xpath("//span[normalize-space()='Click here']")),
      10000,
    );
    await signUpToggle.click();
 
    await driver.wait(until.elementLocated(By.id("name")), 10000);
 
    await driver.findElement(By.id("name")).sendKeys("Duplicate Patient");
    await driver.findElement(By.id("email")).sendKeys(existingPatient.email);
    await driver.findElement(By.id("password")).sendKeys(existingPatient.password);
    await driver.findElement(
      By.xpath("//button[@type='submit' and normalize-space()='Create Account']"),
    ).click();
 
    const errorMessage = await driver.wait(
      until.elementLocated(By.css("p.text-red-600")),
      10000,
    );
    const errorText = await errorMessage.getText();
 
    assert.ok(
      errorText.toLowerCase().includes("email"),
      "Duplicate registration should display an email-related error message.",
    );
 
    pass(TEST_ID, "Duplicate Patient registration was rejected.");
  } finally {
    await driver.quit();
  }
}
 
run().catch((error) => fail(TEST_ID, error));