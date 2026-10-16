// Worked example of natural-motion takes, from the Tallgrass field-training demo (fictional cast) of
// an example product. Its routes, labels and test ids belong to that product: copy this file into
// your demo folder and replace the selectors, names and marks with your app's.
//
//   node takes.example.mjs phone-signin <out-dir>   # worker signs in and opens Courses
//   node takes.example.mjs admin-build  <out-dir>   # admin builds a three-course program
//
// Environment: PORTAL_LINK (the worker's sign-in link, e.g. http://localhost:3001/portal/<token>),
// PORTAL_CODE (the app's local dev one-time code), DEMO_ADMIN_URL and the sign-in variables in
// rec-lib.mjs.
// Before every take, prove which database the running app uses (fixture.md).
import fs from 'node:fs'
import path from 'node:path'
import { ADMIN_URL, ADMIN_VIEWPORT, PHONE_VIEWPORT, Take, adminBrowser, masterSize, phoneBrowser, sleep } from './rec-lib.mjs'

const [which, outDir = '.'] = process.argv.slice(2)
fs.mkdirSync(outDir, { recursive: true })

// Refuse to record things the cut must never show (review-checklist.md).
async function clean(page) {
  if (await page.getByRole('button', { name: /Tanstack query devtools/i }).isVisible().catch(() => false)) throw Error('debug badge visible')
  const text = await page.locator('body').innerText()
  if (/\bHired (on|Sep|Oct)/.test(text)) throw Error('"Hired" label visible')
}

async function failed(page, err) {
  await page.screenshot({ path: path.join(outDir, `${which}-FAILED.png`) }).catch(() => {})
  throw err
}

if (which === 'phone-signin') {
  const link = process.env.PORTAL_LINK
  if (!link || !process.env.PORTAL_CODE) throw Error('set PORTAL_LINK and PORTAL_CODE')
  const { browser, page } = await phoneBrowser()
  try {
    await page.goto(link)
    await page.getByRole('button', { name: 'Send my code' }).waitFor()
    await sleep(1200); await clean(page)
    const take = new Take(page, outDir, 'P1-signin', { ...masterSize(PHONE_VIEWPORT), touch: true })
    await take.start(); take.mark('signin'); await sleep(1200)
    take.mark('send-code-tap'); await take.tap(page.getByRole('button', { name: 'Send my code' }))
    const code = page.getByRole('textbox', { name: 'Enter the 6-digit code' })
    await code.waitFor(); take.mark('code-screen')
    await take.tap(code); await take.type(process.env.PORTAL_CODE); take.mark('code-typed')
    await sleep(650); take.mark('continue-tap')
    await take.tap(page.getByRole('button', { name: 'Continue', exact: true }))
    await page.getByTestId('portal-my-learning-open-courses').waitFor(); take.mark('workspace')
    await sleep(1800); take.mark('open-courses-tap')
    await take.tap(page.getByTestId('portal-my-learning-open-courses'))
    await page.getByText(/of 3 courses done/).waitFor(); await clean(page); take.mark('courses-assigned')
    await sleep(3800)
    console.log(JSON.stringify(await take.stop(1000)))
  } catch (err) { await failed(page, err) } finally { await browser.close() }
} else if (which === 'admin-build') {
  const { browser, page } = await adminBrowser()
  try {
    await page.goto(ADMIN_URL + '/settings/onboarding/templates/new')
    await page.getByText('Name your template', { exact: true }).waitFor()
    await sleep(1200); await clean(page)
    const take = new Take(page, outDir, 'admin-build', masterSize(ADMIN_VIEWPORT))
    await take.start(900, 610); await sleep(900); take.mark('wizard')
    await take.click(page.getByRole('combobox', { name: 'Event', exact: true }))
    await take.click(page.getByRole('option', { name: 'Training', exact: true })); take.mark('event-training')
    await take.click(page.getByRole('textbox', { name: 'Template name', exact: true }))
    await take.type('Field Readiness — First Two Weeks'); take.mark('named'); await take.pause(400, 700)
    await take.click(page.getByRole('button', { name: 'Create template', exact: true }))
    await page.getByRole('button', { name: 'Add course', exact: true }).first().waitFor(); take.mark('builder')
    for (const [i, query] of ['Incident Preparedness', 'Resolving Conflict', 'Can We Talk for Real'].entries()) {
      take.mark(`course${i + 1}-start`)
      await take.click(page.getByRole('button', { name: 'Add course', exact: true }).last())
      await take.click(page.getByRole('searchbox', { name: 'Search courses' }))
      await take.type(query)                       // type the query; cut from here to the result
      const result = page.getByRole('button', { name: new RegExp(query) }).first()
      await result.waitFor(); await take.pause(350, 600); take.mark(`course${i + 1}-result`)
      await take.click(result); await take.pause(300, 500)
      await take.click(page.getByRole('dialog').getByRole('button', { name: 'Save', exact: true }))
      take.mark(`course${i + 1}-saved`); await take.pause(500, 800)
    }
    take.mark('three-courses')
    // …release schedule, timing drawer, start-date preview, publish: same pattern, one mark per beat.
    console.log(JSON.stringify(await take.stop(1500)))
    // The take created a real template. Delete it (or leave it unassigned) and report which.
  } catch (err) { await failed(page, err) } finally { await browser.close() }
} else {
  throw Error('usage: node takes.example.mjs <phone-signin|admin-build> <out-dir>')
}
