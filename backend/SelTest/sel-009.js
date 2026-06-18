const {
  BASE_URL,
  By,
  assert,
  apiRequest,
  buildChromeDriver,
  fail,
  loginAsGeneratedPatient,
  pass,
  until,
} = require("./seleniumTestUtils");
 
const TEST_ID = "SEL-009";
 
function asArray(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload.data)) return payload.data;
  if (Array.isArray(payload.value)) return payload.value;
  return [];
}
 
async function run() {
  const departmentsPayload = await apiRequest("/api/departments");
  const departments = asArray(departmentsPayload);
 
  assert.ok(departments.length > 0, "At least one Department should exist for filter navigation.");
  const department = departments[0];
 
  const driver = await buildChromeDriver();
 
  try {
    await loginAsGeneratedPatient(driver);
    await driver.get(`${BASE_URL}/doctors`);
 
    const departmentFilter = await driver.wait(
      until.elementLocated(By.xpath(`//p[normalize-space()='${department.name}']`)),
      10000,
    );
    await departmentFilter.click();
 
    await driver.wait(
      until.elementLocated(
        By.xpath(`//h1[contains(normalize-space(), 'Browse ${department.name} Doctors')]`),
      ),
      10000,
    );
 
    const bodyText = await driver.findElement(By.css("body")).getText();
    const currentUrl = await driver.getCurrentUrl();
 
    assert.ok(
      currentUrl.includes(`/doctors/${encodeURIComponent(department.name)}`),
      "Department filter should update the route.",
    );
    assert.ok(
      bodyText.includes(`in ${department.name}`),
      "Filtered doctors page should show the selected Department name.",
    );
 
    pass(TEST_ID, `Department filter navigation worked for ${department.name}.`);
  } finally {
    await driver.quit();
  }
}
 
run().catch((error) => fail(TEST_ID, error));