const { createWorker } = require('tesseract.js');
const path = require('path');

async function main() {
  const worker = await createWorker('eng');
  for (let i = 1; i <= 7; i++) {
    const filename = `AD-NW-00${i}.png`;
    const filePath = path.join(__dirname, '..', 'docs', 'NOVAWEAR_Seven_Individual_Ad_Creatives', filename);
    const ret = await worker.recognize(filePath);
    console.log(`\n================ ${filename} OCR ================`);
    console.log(ret.data.text.trim());
  }
  await worker.terminate();
}

main().catch(console.error);

