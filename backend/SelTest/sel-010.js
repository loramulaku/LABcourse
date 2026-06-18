const {
  BASE_URL,
  assert,
  buildChromeDriver,
  fail,
  getCurrentPath,
  pass,
} = require("./seleniumTestUtils");
 
const TEST_ID = "SEL-010";
 
async function run() {
  const driver = await buildChromeDriver();
 
  try {
    await driver.get(`${BASE_URL}/doctors`);
    await driver.wait(async () => (await getCurrentPath(driver)) === "/login", 15000);
 
    assert.equal(
      await getCurrentPath(driver),
      "/login",
      "Unauthenticated user should be redirected from Doctors page to Login.",
    );
 
    pass(TEST_ID, "Unauthenticated access to Doctors page redirected to Login.");
  } finally {
    await driver.quit();
  }
}
 
run().catch((error) => fail(TEST_ID, error));