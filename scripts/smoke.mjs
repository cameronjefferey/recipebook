/**
 * End-to-end smoke test, driven through a real browser at phone sizes.
 *
 *   PB_TOKEN=<a session token> npm run smoke
 *
 * A token comes from scripts/seed.ts, or from the sessions table. The dev
 * server must already be running. Anything this creates, it removes again.
 */
import { chromium, devices } from "playwright-core";
import { mkdirSync } from "node:fs";

const BASE = process.env.PB_BASE ?? "http://localhost:3000";
const TOKEN = process.env.PB_TOKEN;
const SHOTS = process.env.PB_SHOTS ?? "/tmp/pinkbox-shots";

if (!TOKEN) {
  console.error("PB_TOKEN is required. See the comment at the top of this file.");
  process.exit(2);
}
mkdirSync(SHOTS, { recursive: true });

let failures = 0;
const check = (name, ok, detail = "") => {
  console.log(`${ok ? "  ok  " : "  FAIL"} ${name}${detail ? ` — ${detail}` : ""}`);
  if (!ok) failures++;
};
const note = (name, why) => console.log(`  skip ${name} — ${why}`);

const browser = await chromium.launch({ channel: "chrome" });

async function openApp(deviceName) {
  const ctx = await browser.newContext({ ...devices[deviceName] });
  await ctx.addCookies([
    { name: "pinkbox_session", value: TOKEN, domain: new URL(BASE).hostname, path: "/" },
  ]);
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  return { ctx, page, errors };
}

/* ============================================== shelf and book management */
{
  console.log("\nSHELF AND BOOKS");
  const { ctx, page, errors } = await openApp("iPhone 13");

  await page.goto(`${BASE}/book`, { waitUntil: "networkidle" });
  await page.screenshot({ path: `${SHOTS}/shelf.png`, fullPage: true });

  const shelf = () => page.locator("section ul li a h3").allInnerTexts();
  const shelfNames = await shelf();
  check(
    "the standing books are always there",
    ["Everything", "Keepers", "Want to try", "Best loved", "Not in a book"].every((n) =>
      shelfNames.includes(n),
    ),
    shelfNames.join(", "),
  );

  await page.getByLabel("New book name").fill("Smoke test book");
  await page.getByRole("button", { name: "Add" }).click();
  await page.waitForFunction(
    () => [...document.querySelectorAll("h3")].some((h) => h.textContent === "Smoke test book"),
    null,
    { timeout: 10000 },
  );
  check("a new book reaches the shelf", true);

  // file a recipe into it
  await page.goto(`${BASE}/box`, { waitUntil: "networkidle" });
  const recipeCount = await page.locator("ul.grid li a").count();
  if (recipeCount === 0) {
    note("filing a recipe", "the box is empty");
  } else {
    await page.locator("ul.grid li a").first().click();
    await page.waitForURL(/\/r\//);
    const title = await page.locator("h1").innerText();

    const chip = page.getByRole("button", { name: "Smoke test book", exact: true });
    check("the book picker offers the new book", await chip.isVisible());
    check("it starts out unticked", (await chip.getAttribute("aria-pressed")) === "false");
    await chip.click();
    await page.waitForFunction(
      () => {
        const b = [...document.querySelectorAll("button")].find(
          (x) => x.textContent.trim() === "Smoke test book",
        );
        return b?.getAttribute("aria-pressed") === "true";
      },
      null,
      { timeout: 10000 },
    );
    check("ticking it files the recipe", true);

    // Making a book from the recipe page: the book is only real once the
    // server has made it, so the picker has to take the server's word for
    // what exists rather than the list it was first handed.
    const picker = page.locator("section", {
      has: page.locator("h2", { hasText: "In these books" }),
    });
    const chipsBefore = (await picker.locator("button").allInnerTexts()).length;
    await page.getByRole("button", { name: "+ New book" }).click();
    await page.getByLabel("New book name").fill("Smoke picker book");
    await page.getByRole("button", { name: "Add", exact: true }).click();
    const made = picker.getByRole("button", { name: "Smoke picker book", exact: true });
    await made.waitFor({ timeout: 10000 }).catch(() => {});
    check("a book made from the recipe shows up without a reload", await made.isVisible());
    check(
      "and it is one more chip, not a replacement",
      (await picker.locator("button").allInnerTexts()).length === chipsBefore + 1,
    );
    check("and the recipe is already in it", (await made.getAttribute("aria-pressed")) === "true");

    await page.reload({ waitUntil: "networkidle" });
    check(
      "it was really saved, and only once",
      (await picker.locator("button").allInnerTexts()).filter((t) => t === "Smoke picker book")
        .length === 1,
    );

    await page.goto(`${BASE}/book`, { waitUntil: "networkidle" });
    const card = page
      .locator("a", { has: page.locator("h3", { hasText: "Smoke test book" }) })
      .first();
    check("the shelf counts it", /1 recipe\b/.test(await card.innerText()));

    await card.click();
    await page.waitForURL(/\/book\/[0-9a-f-]{36}/);
    check("the book opens on that recipe", (await page.locator("article h2").first().innerText()) === title);
  }

  // rename, then delete, and confirm the recipes survive
  await page.goto(`${BASE}/book`, { waitUntil: "networkidle" });
  await page
    .locator("a", { has: page.locator("h3", { hasText: "Smoke test book" }) })
    .first()
    .click();
  await page.waitForURL(/\/book\/[0-9a-f-]{36}/);
  await page.getByRole("button", { name: "Edit" }).click();
  await page.getByLabel("Book name").fill("Smoke test renamed");
  await page.getByRole("button", { name: "Save" }).click();
  await page.waitForTimeout(1200);
  check("renaming sticks", (await page.locator("h1").innerText()).includes("Smoke test renamed"));

  page.once("dialog", (d) => d.accept());
  await page.getByRole("button", { name: "Edit" }).click();
  await page.getByRole("button", { name: "Delete this book" }).click();
  await page.waitForURL(`${BASE}/book`, { timeout: 10000 });
  check("deleting removes it from the shelf", !(await shelf()).some((n) => n.startsWith("Smoke test")));

  // and take the one made from the recipe page away again
  const leftover = page.locator("a", {
    has: page.locator("h3", { hasText: "Smoke picker book" }),
  });
  if (await leftover.count()) {
    await leftover.first().click();
    await page.waitForURL(/\/book\/[0-9a-f-]{36}/);
    page.once("dialog", (d) => d.accept());
    await page.getByRole("button", { name: "Edit" }).click();
    await page.getByRole("button", { name: "Delete this book" }).click();
    await page.waitForURL(`${BASE}/book`, { timeout: 10000 });
  }
  check("nothing is left behind", !(await shelf()).some((n) => n.startsWith("Smoke ")));

  await page.goto(`${BASE}/box`, { waitUntil: "networkidle" });
  check(
    "deleting a book keeps its recipes",
    (await page.locator("ul.grid li a").count()) === recipeCount,
  );

  check("no page errors", errors.length === 0, errors.slice(0, 2).join(" | "));
  await ctx.close();
}

/* ================================================== the pager, per device */
for (const deviceName of ["iPhone SE", "iPhone 13", "Pixel 7"]) {
  console.log(`\nPAGER — ${deviceName}`);
  const { ctx, page } = await openApp(deviceName);

  await page.goto(`${BASE}/book/all?by=title`, { waitUntil: "networkidle" });
  await page.waitForTimeout(500);

  const track = page.locator('[role="region"][aria-label="Recipe pages"]');
  if ((await track.count()) === 0) {
    note("the pager", "no recipes to page through");
    await ctx.close();
    continue;
  }

  const size = await track.evaluate((el) => ({
    h: el.clientHeight,
    w: el.clientWidth,
    leaves: el.children.length,
  }));
  const vh = await page.evaluate(() => window.innerHeight);

  check("the page gets a fair share of the screen", size.h >= vh * 0.35, `${size.h}px of ${vh}px`);
  check("nothing overflows sideways", await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1));
  check("nothing spills below the fold", await page.evaluate(() => document.documentElement.scrollHeight <= window.innerHeight + 2));
  check(
    "the ordering pills fit without scrolling",
    await page.evaluate(() => {
      const ul = document.querySelector("main ul");
      const s = ul?.parentElement;
      return s ? s.scrollWidth <= s.clientWidth + 1 : false;
    }),
  );

  const at = () => track.evaluate((el) => Math.round(el.scrollLeft / el.clientWidth));
  const rest = () => track.evaluate((el) => el.scrollLeft % el.clientWidth);

  if (size.leaves > 1) {
    const before = await at();
    await page.getByLabel("Next page").click();
    await page.waitForTimeout(700);
    check("Next turns exactly one page", (await at()) === before + 1, `${before} -> ${await at()}`);

    await page.getByLabel("Previous page").click();
    await page.waitForTimeout(700);
    check("Previous turns back", (await at()) === before);

    // a thumb drag must never strand the reader between two pages
    const box = await track.boundingBox();
    await page.mouse.move(box.x + box.width - 30, box.y + box.height / 2);
    await page.mouse.down();
    for (let x = box.width - 30; x > 40; x -= 40) {
      await page.mouse.move(box.x + x, box.y + box.height / 2);
    }
    await page.mouse.up();
    await page.waitForTimeout(800);
    check("a drag always settles on a page", (await rest()) === 0);

    const beforeDie = await at();
    await page.getByLabel("Turn to a recipe at random").click();
    await page.waitForTimeout(900);
    const afterDie = await at();
    check(
      "the die turns somewhere else",
      size.leaves < 3 || afterDie !== beforeDie,
      `${beforeDie} -> ${afterDie}`,
    );
  }

  const photo = await page.evaluate(() => {
    const img = document.querySelector("article img");
    if (!img) return null;
    const t = document.querySelector('[role="region"][aria-label="Recipe pages"]');
    return { photo: img.parentElement.clientHeight, page: t.clientHeight };
  });
  if (photo) {
    check("the photo leaves room for the recipe", photo.photo <= photo.page * 0.45, `${photo.photo}px of ${photo.page}px`);
  } else {
    note("the photo cap", "no recipe has a photo yet");
  }

  await page.screenshot({ path: `${SHOTS}/pager-${deviceName.replace(/\s+/g, "-")}.png` });
  await ctx.close();
}

/* ============================================ sharing a book with somebody */
{
  console.log("\nSHARING");
  const { ctx, page, errors } = await openApp("iPhone 13");

  // a book of its own, so the test never depends on what is on the shelf
  await page.goto(`${BASE}/book`, { waitUntil: "networkidle" });
  await page.getByLabel("New book name").fill("Smoke share book");
  await page.getByRole("button", { name: "Add" }).click();
  await page.waitForFunction(
    () => [...document.querySelectorAll("h3")].some((h) => h.textContent === "Smoke share book"),
    null,
    { timeout: 10000 },
  );

  await page.goto(`${BASE}/box`, { waitUntil: "networkidle" });
  const anyRecipe = await page.locator("ul.grid li a").count();
  let sharedTitle = null;
  if (anyRecipe > 0) {
    await page.locator("ul.grid li a").first().click();
    await page.waitForURL(/\/r\//);
    sharedTitle = await page.locator("h1").innerText();
    await page.getByRole("button", { name: "Smoke share book", exact: true }).click();
    await page.waitForFunction(
      () => {
        const b = [...document.querySelectorAll("button")].find(
          (x) => x.textContent.trim() === "Smoke share book",
        );
        return b?.getAttribute("aria-pressed") === "true";
      },
      null,
      { timeout: 10000 },
    );
  }

  await page.goto(`${BASE}/book`, { waitUntil: "networkidle" });
  await page
    .locator("a", { has: page.locator("h3", { hasText: "Smoke share book" }) })
    .first()
    .click();
  await page.waitForURL(/\/book\/[0-9a-f-]{36}/);
  const bookId = page.url().match(/\/book\/([0-9a-f-]{36})/)[1];

  await page.getByRole("link", { name: "Share" }).click();
  await page.waitForURL(/\/share$/);
  await page.getByLabel("Who is it for").fill("Smoke guest");
  await page.getByRole("button", { name: "Share" }).click();
  await page.waitForFunction(
    () => document.body.innerText.includes("Smoke guest"),
    null,
    { timeout: 10000 },
  );
  const link = await page.locator("code").first().innerText();
  check("a link is minted", /\/shared\/[\w-]{20,}$/.test(link), link);

  // a browser with no session at all, which is what the recipient has
  const guest = await browser.newContext({ ...devices["iPhone 13"] });
  const gp = await guest.newPage();
  const guestErrors = [];
  gp.on("pageerror", (e) => guestErrors.push(e.message));

  const opened = await gp.goto(link, { waitUntil: "networkidle" });
  check("it opens with no account", opened.status() === 200, `HTTP ${opened.status()}`);
  const guestText = await gp.locator("body").innerText();
  check("the book is named for the guest", guestText.includes("Smoke share book"));
  if (sharedTitle) check("the recipe is readable", guestText.includes(sharedTitle));
  check("a guest gets no tab bar", (await gp.locator("nav.no-print").count()) === 0);
  check(
    "a guest gets no Open or Start cooking",
    (await gp.getByRole("link", { name: /^(Open|Start cooking)$/ }).count()) === 0,
  );
  check(
    "search engines are told to stay away",
    ((await gp.locator('meta[name="robots"]').getAttribute("content")) ?? "").includes("noindex"),
  );

  for (const path of ["/box", "/book", "/settings"]) {
    const r = await guest.request.get(BASE + path, { maxRedirects: 0 });
    check(`a guest is turned away from ${path}`, r.status() === 307, `HTTP ${r.status()}`);
  }

  const token = link.split("/").pop();
  const stranger = await guest.request.get(`${BASE}/api/shared/${token}/images/${crypto.randomUUID()}`);
  check("an unrelated photo is refused", stranger.status() === 404, `HTTP ${stranger.status()}`);

  // taking it back has to bite immediately
  await page.goto(`${BASE}/book/${bookId}/share`, { waitUntil: "networkidle" });
  page.once("dialog", (d) => d.accept());
  await page
    .locator("li", { hasText: "Smoke guest" })
    .getByRole("button", { name: "Take back" })
    .click();
  await page.waitForFunction(
    () => !document.body.innerText.includes("Smoke guest"),
    null,
    { timeout: 10000 },
  );
  const revoked = await guest.request.get(link);
  check("the link dies when taken back", revoked.status() === 404, `HTTP ${revoked.status()}`);
  await gp.goto(link, { waitUntil: "networkidle" });
  check(
    "and says so in plain words",
    /link is not working/i.test(await gp.locator("body").innerText()),
  );

  check("no guest page errors", guestErrors.length === 0, guestErrors.slice(0, 2).join(" | "));
  await guest.close();

  // tidy the book away again
  await page.goto(`${BASE}/book/${bookId}`, { waitUntil: "networkidle" });
  page.once("dialog", (d) => d.accept());
  await page.getByRole("button", { name: "Edit" }).click();
  await page.getByRole("button", { name: "Delete this book" }).click();
  await page.waitForURL(`${BASE}/book`, { timeout: 10000 });
  check("the test book is cleaned up", !(await page.locator("section ul li a h3").allInnerTexts()).includes("Smoke share book"));

  check("no owner page errors", errors.length === 0, errors.slice(0, 2).join(" | "));
  await ctx.close();
}

/* ================== ingredients that are themselves recipes ============== */
// Served from here rather than fetched off the web, so the check is about our
// code and not about whether somebody else's site is up today. Needs the
// database only to clear up after itself: recipes have no delete button.
if (!process.env.DATABASE_URL) {
  console.log("\nINGREDIENTS THAT ARE RECIPES");
  note("this section", "needs DATABASE_URL to tidy up after itself");
}
if (process.env.DATABASE_URL) {
  console.log("\nINGREDIENTS THAT ARE RECIPES");
  const { createServer } = await import("node:http");
  const sql = (await import("postgres")).default(process.env.DATABASE_URL);
  const forget = () =>
    sql`DELETE FROM pinkbox.recipes WHERE title IN ('Smoke Component Salad', 'Smoke Corn Relish')`;
  await forget();

  const recipePage = (name, ingredients, steps) => `<!doctype html><html><head>
<script type="application/ld+json">${JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Recipe",
    name,
    recipeIngredient: ingredients.map((i) => i.text),
    recipeInstructions: steps.map((text) => ({ "@type": "HowToStep", text })),
    recipeYield: "4 servings",
  })}</script></head><body><ul class="ingredients">${ingredients
    .map(
      (i) =>
        `<li>&#x25a2; ${i.href ? `${i.before} <a href="${i.href}">${i.link}</a>` : i.text}</li>`,
    )
    .join("")}</ul></body></html>`;

  const pages = {
    "/salad": recipePage(
      "Smoke Component Salad",
      [
        { text: "4 cups shredded kale" },
        // links out to a shop, which is not a recipe however it is dressed up
        { text: "1/8 teaspoon sea salt", before: "1/8 teaspoon", link: "sea salt", href: "https://amzn.to/nope" },
        // links to a recipe on the same site
        { text: "1 1/2 cups smoke corn relish", before: "1 1/2 cups", link: "smoke corn relish", href: "/relish" },
        // links to the same site, but at an address that is never a recipe
        { text: "2 tablespoons olive oil", before: "2 tablespoons", link: "olive oil", href: "/go/oil" },
        // links to a page on the same site that has no recipe on it
        { text: "1 pinch smoked paprika", before: "1 pinch", link: "smoked paprika", href: "/about" },
      ],
      ["Toss the kale.", "Add the relish."],
    ),
    "/relish": recipePage(
      "Smoke Corn Relish",
      [{ text: "2 cups corn" }, { text: "1 diced jalapeno" }],
      ["Char the corn.", "Stir in the jalapeno."],
    ),
    "/about": "<!doctype html><html><body><h1>About us</h1></body></html>",
  };

  const server = createServer((req, res) => {
    const body = pages[req.url.replace(/\/$/, "")] ?? pages[req.url];
    if (!body) {
      res.writeHead(404).end("no");
      return;
    }
    res.writeHead(200, { "Content-Type": "text/html" }).end(body);
  });
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  const origin = `http://127.0.0.1:${server.address().port}`;

  const { ctx, page, errors } = await openApp("iPhone 13");
  try {
    await page.goto(`${BASE}/add/link`, { waitUntil: "networkidle" });
    await page.locator('input[name="url"]').fill(`${origin}/salad`);
    await page.getByRole("button", { name: /add|import|get/i }).first().click();
    await page.waitForURL(/\/r\/[0-9a-f-]{36}/, { timeout: 60000 });
    const saladId = page.url().split("/r/")[1];

    const body = await page.locator("main").innerText();
    check("the recipe arrives", /Smoke Component Salad/i.test(await page.locator("h1").innerText()));
    check(
      "the linked recipe is folded in under its own heading",
      /for the smoke corn relish/i.test(body),
      body.match(/For the [^\n]+/gi)?.join(" | ") ?? "none",
    );
    check("with its own ingredients", /jalapeno/i.test(body));
    check(
      "only the real recipe link counts",
      (await page.getByRole("link", { name: /^Open / }).count()) === 1,
      "sea salt is a shop, /go/ is an advert, /about is not a recipe",
    );

    await page.goto(`${BASE}/box`, { waitUntil: "networkidle" });
    const shelf = await page.locator("body").innerText();
    check("the component is a recipe of its own now", /Smoke Corn Relish/i.test(shelf));
    check("and nothing else was dragged in", !/About us/i.test(shelf));

    // steps: make the relish, then the salad
    await page.goto(`${BASE}/cook/${saladId}`, { waitUntil: "networkidle" });
    const first = await page.locator("p").filter({ hasText: /Step 1 of/i }).innerText();
    check("cooking begins with the component", /smoke corn relish/i.test(first), first);
    check("and counts all four steps", /of 4/i.test(first), first);

    // asking for the same page again must not make a second relish
    await page.goto(`${BASE}/add/link`, { waitUntil: "networkidle" });
    await page.locator('input[name="url"]').fill(`${origin}/salad/`); // trailing slash
    await page.getByRole("button", { name: /add|import|get/i }).first().click();
    await page.waitForURL(/\/r\/[0-9a-f-]{36}/, { timeout: 60000 });
    const again = page.url().split("/r/")[1];

    const onShelf = async (title) =>
      (await page.locator("ul.grid li a").allInnerTexts()).filter((t) =>
        t.split("\n").some((line) => line.trim() === title),
      ).length;

    await page.goto(`${BASE}/box`, { waitUntil: "networkidle" });
    check(
      "importing it twice reuses the component rather than copying it",
      (await onShelf("Smoke Corn Relish")) === 1,
      `${await onShelf("Smoke Corn Relish")} relishes`,
    );

    check("the second import is its own recipe", again !== saladId);

    // If the component is ever thrown away, the recipe that leant on it must
    // still read as the ordinary line it always was.
    await sql`DELETE FROM pinkbox.recipes WHERE title = 'Smoke Corn Relish'`;
    await page.goto(`${BASE}/r/${saladId}`, { waitUntil: "networkidle" });
    const orphaned = await page.locator("main").innerText();
    check("losing the component leaves the recipe readable", /smoke corn relish/i.test(orphaned));
    check("with no heading for a recipe that is gone", !/for the smoke corn relish/i.test(orphaned));
    check(
      "and no link to nowhere",
      (await page.getByRole("link", { name: /^Open / }).count()) === 0,
    );

    check("no page errors", errors.length === 0, errors.slice(0, 2).join(" | "));
  } finally {
    await forget();
    await page.goto(`${BASE}/box`, { waitUntil: "networkidle" });
    check(
      "nothing is left behind",
      !/Smoke Component Salad|Smoke Corn Relish/i.test(await page.locator("body").innerText()),
    );
    await ctx.close();
    await sql.end();
    server.close();
  }
}

/* ==================================== meal plan and grocery list ======== */
// Needs the database only to tidy up after itself: recipes have no delete
// button, and the plan is meant to survive until somebody clears it.
if (!process.env.DATABASE_URL) {
  console.log("\nMEAL PLAN AND GROCERY LIST");
  note("this section", "needs DATABASE_URL to tidy up after itself");
}
if (process.env.DATABASE_URL) {
  console.log("\nMEAL PLAN AND GROCERY LIST");
  const sql = (await import("postgres")).default(process.env.DATABASE_URL);
  const CHILI = "Smoke Plan Chili";
  const TACOS = "Smoke Plan Tacos";
  const forget = () => sql`DELETE FROM pinkbox.recipes WHERE title IN (${CHILI}, ${TACOS})`;
  await forget();

  const { ctx, page, errors } = await openApp("iPhone 13");
  try {
    const write = async (title, ingredients) => {
      await page.goto(`${BASE}/add/write`, { waitUntil: "networkidle" });
      await page.getByLabel("Name").fill(title);
      await page.getByLabel("Ingredients").fill(ingredients.join("\n"));
      await page.getByLabel("Steps").fill("Do it.");
      await page.getByRole("button", { name: /Save|Add/ }).first().click();
      await page.waitForURL(/\/r\//, { timeout: 20000 });
      return page.url().split("/r/")[1];
    };
    const planBody = () => page.locator("main").innerText();

    await write(CHILI, [
      "2 cloves garlic, minced",
      "1 cup flour",
      "salt and pepper",
      "1 can black beans",
    ]);

    // the toggle, on the recipe page it came from
    const chip = page.getByRole("button", { name: "Cook this week" });
    check("a fresh recipe starts off the list", (await chip.getAttribute("aria-pressed")) === "false");
    await chip.click();
    await page.waitForFunction(() => document.body.innerText.includes("Cooking this week"), null, {
      timeout: 10000,
    });
    await page.reload({ waitUntil: "networkidle" });
    check(
      "cook this week survives a reload",
      (await page.getByRole("button", { name: "Cooking this week" }).getAttribute("aria-pressed")) ===
        "true",
    );

    await write(TACOS, [
      "1 clove garlic, minced",
      "2 tablespoons flour",
      "salt and pepper",
      "8 corn tortillas",
    ]);

    // the second one, added in a batch from the box grid
    await page.goto(`${BASE}/box`, { waitUntil: "networkidle" });
    await page.getByRole("button", { name: "Select", exact: true }).click();
    await page.getByRole("button", { name: `Select ${TACOS}` }).click();
    await page.getByRole("button", { name: /Add 1 to this week/ }).click();
    await page.waitForFunction(
      () => document.body.innerText.includes("Added 1 recipe to this week"),
      null,
      { timeout: 10000 },
    );
    check("the box confirms a batch addition", true);

    await page.goto(`${BASE}/plan`, { waitUntil: "networkidle" });
    check(
      "both meals are on this week's list",
      /Smoke Plan Chili/.test(await planBody()) && /Smoke Plan Tacos/.test(await planBody()),
    );
    check(
      "matching cloves of garlic add together",
      /3 cloves garlic, minced/i.test(await planBody()),
      await planBody(),
    );
    check(
      "a merged line says which meals it came from",
      /for smoke plan chili, smoke plan tacos/i.test(await planBody()),
    );
    check(
      "flour in different units stays on two lines rather than being guessed at",
      /1 cup flour/i.test(await planBody()) && /2 tablespoons flour/i.test(await planBody()),
    );
    check(
      "an identical unquantified line only appears once",
      (await planBody()).match(/salt and pepper/gi)?.length === 1,
    );
    check(
      "each meal's own ingredient still made the list",
      /black beans/i.test(await planBody()) && /corn tortillas/i.test(await planBody()),
    );

    // crossing an item off, and having it stick
    const garlicLine = page.getByRole("button", { name: /garlic/i });
    check("a grocery line starts unchecked", (await garlicLine.getAttribute("aria-pressed")) === "false");
    await garlicLine.click();
    await page.waitForFunction(() =>
      [...document.querySelectorAll('button[aria-pressed="true"]')].some((b) =>
        b.textContent.includes("garlic"),
      ),
    );
    await page.reload({ waitUntil: "networkidle" });
    check(
      "a checked line is still checked after a reload",
      (await page.getByRole("button", { name: /garlic/i }).getAttribute("aria-pressed")) === "true",
    );

    // something nobody wrote a recipe for
    await page.getByLabel("Add an item to the grocery list").fill("paper towels");
    await page.getByRole("button", { name: "Add", exact: true }).click();
    await page.waitForFunction(() => document.body.innerText.includes("paper towels"));
    check("a hand-added item joins the list", /paper towels/i.test(await planBody()));
    await page.getByRole("button", { name: "paper towels", exact: true }).click();
    await page.waitForFunction(() =>
      [...document.querySelectorAll('button[aria-pressed="true"]')].some(
        (b) => b.textContent.trim() === "paper towels",
      ),
    );
    await page.reload({ waitUntil: "networkidle" });
    check(
      "and it stays checked after a reload too",
      (await page.getByRole("button", { name: "paper towels", exact: true }).getAttribute(
        "aria-pressed",
      )) === "true",
    );
    await page.getByRole("button", { name: "Remove paper towels" }).click();
    await page.waitForFunction(() => !document.body.innerText.includes("paper towels"));
    check("removing a hand-added item takes it off for good", !/paper towels/i.test(await planBody()));

    // taking a meal off the plan recomputes the list, not just hides a row
    await page.getByRole("button", { name: `Take ${CHILI} off this week` }).click();
    await page.waitForFunction(() => !document.body.innerText.includes("Smoke Plan Chili"));
    check("chili leaves the meal list", !/Smoke Plan Chili/.test(await planBody()));
    check("black beans leave with it", !/black beans/i.test(await planBody()));
    check(
      "garlic drops back down rather than staying at the old total",
      /1 clove garlic, minced/i.test(await planBody()) && !/3 cloves garlic/i.test(await planBody()),
    );

    // starting a new week clears the plan and the list, but not the recipes
    page.once("dialog", (d) => d.accept());
    await page.getByRole("button", { name: "Start a new week" }).click();
    await page.waitForFunction(() => document.body.innerText.includes("Nothing yet"));
    check("the plan is empty", !/Smoke Plan Tacos/.test(await planBody()));
    check("so is the grocery list", !/tortillas/i.test(await planBody()));

    await page.goto(`${BASE}/box`, { waitUntil: "networkidle" });
    check(
      "starting a new week never touches the recipes themselves",
      /Smoke Plan Tacos/.test(await page.locator("body").innerText()),
    );

    check("no page errors", errors.length === 0, errors.slice(0, 2).join(" | "));
  } finally {
    await forget();
    await ctx.close();
    await sql.end();
  }
}

/* ============================ two boxes, one book passed between them */
// Needs the sign-up code and a database to tidy up after itself, both of which
// come from the environment: neither belongs in the repository.
const INVITE = process.env.INVITE_CODE ?? process.env.PB_INVITE;
if (!process.env.DATABASE_URL || !INVITE) {
  console.log("\nSHARING BETWEEN TWO BOXES");
  check("skipped: needs DATABASE_URL and INVITE_CODE", false, "set them and run again");
}
if (process.env.DATABASE_URL && INVITE) {
  console.log("\nSHARING BETWEEN TWO BOXES");
  const stamp = Date.now();
  const BOOK = `Smoke shared book ${stamp}`;
  const sql = (await import("postgres")).default(process.env.DATABASE_URL);

  /** A person with a box of their own, made the way anybody would make one. */
  async function signUp(who) {
    const ctx = await browser.newContext({ ...devices["iPhone 13"] });
    const page = await ctx.newPage();
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto(`${BASE}/join`, { waitUntil: "networkidle" });
    await page.getByLabel("Your name").fill(who);
    await page.getByLabel("Email").fill(`${who}${stamp}@smoke.test`);
    await page.getByLabel("Password").fill("apasswordthatislong");
    await page.getByLabel("Invite code").fill(INVITE);
    await page.getByRole("button", { name: /Create my box/ }).click();
    await page.waitForURL(`${BASE}/box`, { timeout: 20000 });
    return { ctx, page, errors };
  }

  async function write(page, title) {
    await page.goto(`${BASE}/add/write`, { waitUntil: "networkidle" });
    await page.getByLabel("Name").fill(title);
    await page.getByLabel("Ingredients").fill("1 thing");
    await page.getByLabel("Steps").fill("Do it.");
    await page.getByRole("button", { name: /Save|Add/ }).first().click();
    await page.waitForURL(/\/r\//, { timeout: 20000 });
  }

  const { ctx: owner, page: op, errors: ownerErrors } = await openApp("iPhone 13");
  const guest = await signUp("Smokeguest");

  check(
    "signing up gets you a box of your own, not somebody else's",
    !/Turkey|Tart|Carrots|Teriyaki/.test(await guest.page.locator("body").innerText()),
  );

  await op.goto(`${BASE}/book`, { waitUntil: "networkidle" });
  await op.getByLabel("New book name").fill(BOOK);
  await op.getByRole("button", { name: "Add" }).click();
  await op.waitForFunction(
    (n) => [...document.querySelectorAll("h3")].some((h) => h.textContent === n),
    BOOK,
    { timeout: 10000 },
  );
  await op.locator("a", { has: op.locator("h3", { hasText: BOOK }) }).first().click();
  await op.waitForURL(/\/book\/[0-9a-f-]{36}/);
  const bookId = op.url().match(/\/book\/([0-9a-f-]{36})/)[1];

  await op.getByRole("link", { name: "Share" }).click();
  await op.waitForURL(/\/share$/);
  await op.getByLabel("Who is it for").fill("Smokeguest");
  await op.getByLabel(/Let them add their own/).check();
  await op.getByRole("button", { name: "Share" }).click();
  await op.waitForFunction(() => document.body.innerText.includes("Smokeguest"), null, {
    timeout: 10000,
  });
  const link = await op.locator("code").first().innerText();

  await guest.page.goto(link, { waitUntil: "networkidle" });
  await guest.page.getByRole("button", { name: /Keep this on my shelf/ }).click();
  await guest.page.waitForURL(/\/book\//, { timeout: 20000 });
  await guest.page.goto(`${BASE}/book`, { waitUntil: "networkidle" });
  check(
    "an accepted book lands under Shared with you",
    /Shared with you/i.test(await guest.page.locator("body").innerText()),
  );

  // planning is a personal note on top of anything visible, not a change to
  // the recipe, so a recipe let into a shared book can be planned by the
  // guest same as any other — right up until access is taken back.
  const SHARED_MEAL = `Smoke Shared Meal ${stamp}`;
  await op.goto(`${BASE}/add/write`, { waitUntil: "networkidle" });
  await op.getByLabel("Name").fill(SHARED_MEAL);
  await op.getByLabel("Ingredients").fill("2 cups smoke shared broth");
  await op.getByLabel("Steps").fill("Simmer it.");
  await op.getByRole("button", { name: /Save|Add/ }).first().click();
  await op.waitForURL(/\/r\//, { timeout: 20000 });
  const sharedMealId = op.url().split("/r/")[1];
  await op.getByRole("button", { name: new RegExp(BOOK) }).click();
  await op.waitForFunction(
    (n) =>
      [...document.querySelectorAll("button")]
        .find((x) => x.textContent.includes(n))
        ?.getAttribute("aria-pressed") === "true",
    BOOK,
    { timeout: 10000 },
  );

  // The book itself is a flip-through pager, so go straight to the recipe by
  // address rather than hunting for it a page at a time.
  await guest.page.goto(`${BASE}/r/${sharedMealId}`, { waitUntil: "networkidle" });
  await guest.page.getByRole("button", { name: "Cook this week" }).click();
  await guest.page.waitForFunction(() => document.body.innerText.includes("Cooking this week"), null, {
    timeout: 10000,
  });

  await guest.page.goto(`${BASE}/plan`, { waitUntil: "networkidle" });
  check(
    "a guest can plan a recipe shared into their shelf",
    (await guest.page.locator("main").innerText()).includes(SHARED_MEAL),
  );
  check(
    "and its ingredients reach their grocery list",
    /smoke shared broth/i.test(await guest.page.locator("main").innerText()),
  );

  await write(guest.page, `Smoke Guest Dish ${stamp}`);
  await guest.page.getByRole("button", { name: new RegExp(BOOK) }).click();
  await guest.page.waitForFunction(
    (n) =>
      [...document.querySelectorAll("button")]
        .find((x) => x.textContent.includes(n))
        ?.getAttribute("aria-pressed") === "true",
    BOOK,
    { timeout: 10000 },
  );

  await op.goto(`${BASE}/book/${bookId}`, { waitUntil: "networkidle" });
  check(
    "the owner sees what a contributor put in",
    (await op.locator("body").innerText()).includes("Smoke Guest Dish"),
  );
  await op.goto(`${BASE}/box`, { waitUntil: "networkidle" });
  check(
    "but it does not join the owner's own box",
    !(await op.locator("body").innerText()).includes("Smoke Guest Dish"),
  );

  // what the guest may not do
  const forbidden = await Promise.all([
    guest.ctx.request.get(`${BASE}/book/${bookId}/share`, { maxRedirects: 0 }),
    guest.ctx.request.get(`${BASE}/box`, { maxRedirects: 0 }),
  ]);
  check("a contributor cannot pass the book on", forbidden[0].status() === 404);
  check("and has a box of their own to land in", forbidden[1].status() === 200);

  await op.goto(`${BASE}/book/${bookId}/share`, { waitUntil: "networkidle" });
  op.once("dialog", (d) => d.accept());
  await op
    .locator("li", { hasText: "Smokeguest" })
    .getByRole("button", { name: "Take back" })
    .click();
  await op.waitForFunction(() => !document.body.innerText.includes("Smokeguest"), null, {
    timeout: 10000,
  });
  check(
    "taking it back closes the book",
    (await guest.ctx.request.get(`${BASE}/book/${bookId}`, { maxRedirects: 0 })).status() === 404,
  );
  await guest.page.goto(`${BASE}/box`, { waitUntil: "networkidle" });
  check(
    "but the contributor keeps their own recipe",
    (await guest.page.locator("body").innerText()).includes("Smoke Guest Dish"),
  );

  await guest.page.goto(`${BASE}/plan`, { waitUntil: "networkidle" });
  check(
    "losing access to a book takes its meal off the guest's plan too",
    !(await guest.page.locator("main").innerText()).includes(SHARED_MEAL),
  );

  check("no owner page errors", ownerErrors.length === 0, ownerErrors.slice(0, 1).join(""));
  check("no guest page errors", guest.errors.length === 0, guest.errors.slice(0, 1).join(""));

  // put the kitchen back
  await op.goto(`${BASE}/book/${bookId}`, { waitUntil: "networkidle" });
  op.once("dialog", (d) => d.accept());
  await op.getByRole("button", { name: "Edit" }).click();
  await op.getByRole("button", { name: "Delete this book" }).click();
  await op.waitForURL(`${BASE}/book`, { timeout: 10000 });

  await sql`DELETE FROM pinkbox.recipes WHERE title = ${SHARED_MEAL}`;
  await sql`DELETE FROM pinkbox.households WHERE name LIKE ${"Smokeguest%"}`;
  await sql.end();
  await guest.ctx.close();
  await owner.close();
}

/* ==================================================== addresses that are junk */
{
  console.log("\nJUNK ADDRESSES");
  const { ctx } = await openApp("iPhone 13");

  // Postgres refuses to compare a uuid column with "abc" and raises, so
  // anything taking an id from the URL has to check the shape first or a
  // wrong address becomes a 500.
  for (const path of [
    "/r/abc",
    "/cook/abc",
    "/book/abc",
    "/book/abc/share",
    "/api/images/abc",
    "/api/captures/abc/image",
    "/api/shared/nope/images/abc",
    "/shared/nope",
  ]) {
    const res = await ctx.request.get(BASE + path, { maxRedirects: 0 });
    check(`${path} is a plain 404`, res.status() === 404, `HTTP ${res.status()}`);
  }
  await ctx.close();
}

/* ================================= the shell holds together on every page */
{
  console.log("\nSHELL");
  const { ctx, page, errors } = await openApp("iPhone SE");

  await page.goto(`${BASE}/box`, { waitUntil: "networkidle" });
  const first = await page.locator("ul.grid li a").first().getAttribute("href");
  const paths = ["/box", "/search", "/settings", "/add", "/book", "/book/all", "/plan"];
  if (first) paths.push(first);

  for (const path of paths) {
    await page.goto(BASE + path, { waitUntil: "networkidle" });
    await page.waitForTimeout(200);
    const m = await page.evaluate(() => {
      const main = document.querySelector("main");
      return {
        overflowX: document.documentElement.scrollWidth > window.innerWidth + 1,
        overflowY: document.documentElement.scrollHeight > window.innerHeight + 2,
        scrollable: main.scrollHeight > main.clientHeight + 1,
        header: document.querySelector("header").getBoundingClientRect().top >= -1,
        tabs:
          Math.abs(
            document.querySelector("nav.no-print").getBoundingClientRect().bottom -
              window.innerHeight,
          ) < 2,
      };
    });
    check(`${path} sits inside the screen`, !m.overflowX && !m.overflowY);
    check(`${path} keeps header and tabs put`, m.header && m.tabs);
    if (m.scrollable) {
      check(
        `${path} scrolls to its end`,
        await page.evaluate(() => {
          const main = document.querySelector("main");
          main.scrollTop = 1e5;
          return main.scrollTop > 0;
        }),
      );
    }
  }

  check("no page errors", errors.length === 0, errors.slice(0, 2).join(" | "));
  await ctx.close();
}

await browser.close();
console.log(`\n${failures === 0 ? "ALL SMOKE CHECKS PASSED" : `${failures} CHECK(S) FAILED`}`);
process.exit(failures === 0 ? 0 : 1);
