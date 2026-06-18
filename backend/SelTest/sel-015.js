const {
  BASE_URL,
  By,
  assert,
  buildChromeDriver,
  fail,
  pass,
  until,
} = require("./seleniumTestUtils");
 
const TEST_ID = "SEL-015";
 
async function run() {
  const driver = await buildChromeDriver();
 
  try {
    await driver.get(BASE_URL);
 
    const aboutLink = await driver.wait(
      until.elementLocated(By.xpath("//li[normalize-space()='ABOUT']")),
      10000,
    );
    await aboutLink.click();
 
    await driver.wait(
      until.elementLocated(By.xpath("//*[contains(normalize-space(), 'WHY CHOOSE US')]")),
      10000,
    );
 
    const currentUrl = await driver.getCurrentUrl();
    const bodyText = await driver.findElement(By.css("body")).getText();
 
    assert.ok(currentUrl.includes("/about"), "ABOUT navigation should open /about.");
    assert.ok(bodyText.includes("ABOUT US"), "About page should display ABOUT US.");
    assert.ok(bodyText.includes("WHY CHOOSE US"), "About page should display WHY CHOOSE US.");
 
    pass(TEST_ID, "Navbar navigation opened the About page successfully.");
  } finally {
    await driver.quit();
  }
}
 
run().catch((error) => fail(TEST_ID, error));