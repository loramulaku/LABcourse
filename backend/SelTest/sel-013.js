const {
  BASE_URL,
  By,
  assert,
  buildChromeDriver,
  fail,
  pass,
  until,
} = require("./seleniumTestUtils");
 
const TEST_ID = "SEL-013";
 
async function run() {
  const driver = await buildChromeDriver();
 
  try {
    await driver.get(`${BASE_URL}/contact`);
 
    await driver.wait(
      until.elementLocated(By.xpath("//*[contains(normalize-space(), \"Let's Get In Touch\")]")),
      10000,
    );
 
    await driver.findElement(By.xpath("//button[@type='submit']")).click();
 
    const isFormValid = await driver.executeScript(
      "return document.querySelector('form').checkValidity();",
    );
    const focusedElementId = await driver.executeScript(
      "return document.activeElement && document.activeElement.id;",
    );
 
    assert.equal(isFormValid, false, "Empty contact form should be invalid.");
    assert.equal(
      focusedElementId,
      "firstName",
      "Browser validation should focus firstName first.",
    );
 
    pass(TEST_ID, "Contact form required field validation blocked empty submission.");
  } finally {
    await driver.quit();
  }
}
 
run().catch((error) => fail(TEST_ID, error));