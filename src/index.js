// puppeteer-extra is a drop-in replacement for puppeteer,
// it augments the installed puppeteer with plugin functionality
import CONF from './config'
import nodemailer from 'nodemailer'
import puppeteer from 'puppeteer-extra'
import StealthPlugin from 'puppeteer-extra-plugin-stealth'
import mailgun from 'mailgun-js'

puppeteer.use(StealthPlugin())

// Set up emails
const mailer = mailgun(CONF.MAILGUN)
const SHOPPING_URL = 'https://www.monoprix.fr/courses-en-ligne'
const DEBUG = false

export const sendEmail = (slotsCount) => {
  return new Promise((resolve, reject) => {
    const message = {
      from: 'monoprix-corona@thomschell.com',
      to: 'thom.schell@gmail.com',
      subject: 'Créneaux disponibles sur monoprix.com',
      text: `${slotsCount} jours avec des disponibles !`
    }
    mailer.messages().send(message, (error, body) => {
      if (error) {
        console.log("error sending email")
        reject(error)
      } else {
        console.log("sent email")
        resolve()
      }
    })
  })
}

const run = async() => {
  const browser = await puppeteer.launch({
    headless: !DEBUG
  })
  const page = await browser.newPage()
  await page.goto(SHOPPING_URL)
  await page.click('.slot-container.slot-container--survolable.transition-smooth')
  await page.waitForSelector('input[type=email]')
  await page.type('input[type=email]', CONF.MONOPRIX.email)
  await page.type('input[type=password]', CONF.MONOPRIX.pwd) 
  await page.click('button[type=submit]')
  await page.waitForSelector('.days-label__item__btn') 
  const count = await page.evaluate(() => {
    const countSlots = document.querySelectorAll('.days-label__item__btn:not([disabled])').length
    return countSlots
  })
  await browser.close()
  if(count > 0) {
    await sendEmail(count)
  }
}

run()
