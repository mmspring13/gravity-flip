import config from './game/PhaserGame.ts';
import {initLanguage, isValidLanguage} from "./game/translations.ts";

async function start() {
  await initSDK();
  let lang = (window as any)?.ysdk?.environment.i18n.lang;
  if (!isValidLanguage(lang)) {
    lang = null;
  }
  initLanguage(lang);
  new Phaser.Game(config);
}

async function initSDK() {
  if ((window as any)?.YaGames) {
    (window as any).ysdk = await (window as any)?.YaGames?.init();
  }
}

const ya = true;

document.addEventListener('DOMContentLoaded', async () => {
  if (ya) {
    const script = document.createElement('script');
    script.src = '/sdk.js';
    script.async = true;
    script.onload = start;
    script.onerror = start;
    document.body.append(script);
  } else {
    await start();
  }
});