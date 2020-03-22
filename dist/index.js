"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.sendEmail = void 0;

var _config = _interopRequireDefault(require("./config"));

var _nodemailer = _interopRequireDefault(require("nodemailer"));

var _puppeteerExtra = _interopRequireDefault(require("puppeteer-extra"));

var _puppeteerExtraPluginStealth = _interopRequireDefault(require("puppeteer-extra-plugin-stealth"));

var _mailgunJs = _interopRequireDefault(require("mailgun-js"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// puppeteer-extra is a drop-in replacement for puppeteer,
// it augments the installed puppeteer with plugin functionality
_puppeteerExtra.default.use((0, _puppeteerExtraPluginStealth.default)()); // Set up emails


const mailer = (0, _mailgunJs.default)(_config.default.MAILGUN);
const SHOPPING_URL = 'https://www.monoprix.fr/courses-en-ligne';
const DEBUG = false;

const sendEmail = slotsCount => {
  return new Promise((resolve, reject) => {
    const message = {
      from: 'monoprix-corona@thomschell.com',
      to: 'thom.schell@gmail.com',
      subject: 'Créneaux disponibles sur monoprix.com',
      text: `${slotsCount} jours avec des disponibles !`
    };
    mailer.messages().send(message, (error, body) => {
      if (error) {
        console.log("error sending email");
        reject(error);
      } else {
        console.log("sent email");
        resolve();
      }
    });
  });
};

exports.sendEmail = sendEmail;

const run = async () => {
  const browser = await _puppeteerExtra.default.launch({
    headless: !DEBUG
  });
  const page = await browser.newPage();
  await page.goto(SHOPPING_URL);
  await page.click('.slot-container.slot-container--survolable.transition-smooth');
  await page.waitForSelector('input[type=email]');
  await page.type('input[type=email]', _config.default.MONOPRIX.email);
  await page.type('input[type=password]', _config.default.MONOPRIX.pwd);
  await page.click('button[type=submit]');
  await page.waitForSelector('.days-label__item__btn');
  const count = await page.evaluate(() => {
    const countSlots = document.querySelectorAll('.days-label__item__btn:not([disabled])').length;
    return countSlots;
  });
  console.log("debug count", count);
  await browser.close();
  await sendEmail(count);
};

run();