const {
  BASE_URL,
  By,
  assert,
  buildChromeDriver,
  fail,
  pass,
  until,
} = require("./seleniumTestUtils");
 
const TEST_ID = "SEL-012";
 
async function run() {
  const driver = await buildChromeDriver();
 
  try {
    await driver.get(`${BASE_URL}/laboratories`);
 
    await driver.wait(
      until.elementLocated(By.xpath("//h1[normalize-space()='Medical Laboratories']")),
      10000,
    );
 
    const bodyText = await driver.findElement(By.css("body")).getText();
 
    assert.ok(
      bodyText.includes("Medical Laboratories"),
      "Laboratories page should show the Medical Laboratories heading.",
    );
    assert.ok(
      bodyText.includes("Book Analysis") || bodyText.includes("No Laboratories Available"),
      "Laboratories page should show either available labs or the empty state.",
    );
 
    pass(TEST_ID, "Laboratories page navigation displayed the expected content.");
  } finally {
    await driver.quit();
  }
}
 
run().catch((error) => fail(TEST_ID, error));