import { chromium } from "playwright-chromium";
import { config } from "./config";

const TOAS_LOGIN_URL = "https://hakemus.tampuuri.fi/toas/muokkaus/";

type Apartment = {
  name: string;
  placement: number;
};

type Queue = {
  id: number;
  kind: string; // "Yksiöhakemus" | "Perhehakemus" | "Soluhakemus";
  createdAt: string; // dd.mm.YYYY
  expiresAt: string; // dd.mm.YYYY
  applicants: number;
  apartments: Apartment[];
};

export async function getQueues() {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  await page.goto(TOAS_LOGIN_URL);
  await page.$eval(
    "input[type=email]",
    (el, username) => {
      (el as HTMLInputElement).value = username;
    },
    config.TOAS_USERNAME
  );
  await page.$eval(
    "input[type=password]",
    (el, password) => {
      (el as HTMLInputElement).value = password;
    },
    config.TOAS_PASSWORD
  );
  await page.click('button[type="submit"]');

  await page.waitFor(
    "a[id^='MainPlaceHolder_ucHakemusLista_lukittuMuokkausId_']"
  );

  const applications = await page.evaluate(() => {
    return Array.from(
      document.body.querySelectorAll(
        "label[id^='MainPlaceHolder_ucHakemusLista_tyyppi_']"
      )
    ).map((row) => {
      const columns = row.parentElement?.parentElement?.querySelectorAll("td");

      if (!columns) {
        return null;
      }

      const id = Number(row.id.split("_")[3]);
      const kind = columns[1].innerText;
      const createdAt = columns[2].innerText;
      const expiresAt = columns[3].innerText;
      const applicants = Number(columns[4].innerText);

      return { id, kind, createdAt, expiresAt, applicants };
    });
  });

  const queues: Queue[] = [];

  for (const application of applications) {
    if (!application) {
      console.error("Application failed to parse");

      continue;
    }

    await page.click(
      `a#MainPlaceHolder_ucHakemusLista_sijaJonoId_${application.id}`
    );
    await page.waitFor(
      `table#MainPlaceHolder_ucHakemusLista_jonoId_${application.id}`,
      { timeout: 1000 * 120 }
    );
    const queue = await page.evaluate((applicationId) => {
      const tableRows = Array.from(
        document.querySelectorAll(
          `table#MainPlaceHolder_ucHakemusLista_jonoId_${applicationId} table tr`
        )
      );
      const tableRowsWithoutLegend = tableRows.slice(1);
      return tableRowsWithoutLegend
        .map((row) => {
          const name = row.querySelector<HTMLTableCellElement>("td:first-child")
            ?.innerText;
          const placement = row.querySelector<HTMLTableCellElement>(
            "td:last-child"
          )?.innerText;

          if (!name || !placement) {
            return null;
          }

          return { name, placement: Number(placement) };
        })
        .filter((apartment) => apartment !== null) as Apartment[];
    }, application.id);

    queues.push({
      ...application,
      apartments: queue,
    });
  }

  await browser.close();
  return queues;
}
