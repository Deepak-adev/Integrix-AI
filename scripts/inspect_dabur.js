const fs = require('fs');
const path = require('path');
const Tesseract = require('../client/node_modules/tesseract.js');

const daburDir = path.join(__dirname, '..', 'Dabour');

async function ocrFile(filePath) {
  try {
    const res = await Tesseract.recognize(filePath, 'eng');
    return res.data.text;
  } catch (err) {
    return `ERROR: ${err.message}`;
  }
}

async function run() {
  const targets = [
    path.join(daburDir, '912c1616-128d-43f6-84bc-104bb501594f.png'),
    path.join(daburDir, 'advertisement fake', '456b225e-897e-4648-9970-f463774edae4.png'),
    path.join(daburDir, 'advertisement fake', '5e8f511d-bec8-4a56-9d75-0eddf92c4564.png'),
    path.join(daburDir, 'advertisement fake', '62baf967-4dd7-4690-9053-6c07f4436ddd.png'),
    path.join(daburDir, 'advertisement real', 'ee549abc-2354-4868-97d9-bdf7137c5470.png'),
    path.join(daburDir, 'advertisement real', 'WhatsApp Image 2026-11-16 at 1.00.35 AM.jpeg'),
    path.join(daburDir, 'advertisement real', 'WhatsApp Image 2026-11-16 at 1.00.59 AM.jpeg'),
  ];

  for (const t of targets) {
    if (fs.existsSync(t)) {
      console.log('====================================');
      console.log('FILE:', path.relative(daburDir, t));
      const text = await ocrFile(t);
      console.log(text.trim());
    }
  }
}

run();
