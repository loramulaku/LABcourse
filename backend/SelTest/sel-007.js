const {
  BASE_URL,
  By,
  assert,
  buildChromeDriver,
  fail,
  pass,
  until,
} = require("./seleniumTestUtils");
 
const TEST_ID = "SEL-007";
 
async function run() {
  const driver = await buildChromeDriver();
 
  try {
    await driver.get(`${BASE_URL}/login`);
 
    const signUpToggle = await driver.wait(
      until.elementLocated(By.xpath("//span[normalize-space()='Click here']")),
      10000,
    );
    await signUpToggle.click();
 
    await driver.wait(until.elementLocated(By.id("name")), 10000);
 
    const createButton = await driver.findElement(
      By.xpath("//button[@type='submit' and normalize-space()='Create Account']"),
    );
    await createButton.click();
 
    const isFormValid = await driver.executeScript(
      "return document.querySelector('form').checkValidity();",
    );
    const focusedElementId = await driver.executeScript(
      "return document.activeElement && document.activeElement.id;",
    );
 
    assert.equal(isFormValid, false, "Empty signup form should be invalid.");
    assert.equal(focusedElementId, "name", "Browser validation should focus the Full Name field first.");
 
    pass(TEST_ID, "Required field validation prevented empty Patient registration.");
  } finally {
    await driver.quit();
  }
}
 
run().catch((error) => fail(TEST_ID, error));