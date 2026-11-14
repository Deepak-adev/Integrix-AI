const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');
const mammoth = require('mammoth');
const pdf = require('pdf-parse');

async function inspectXLSX(filePath) {
  console.log(`\n================== XLSX: ${filePath} ==================`);
  const workbook = xlsx.readFile(filePath);
  workbook.SheetNames.forEach(sheetName => {
    console.log(`\n--- Sheet: ${sheetName} ---`);
    const sheet = workbook.Sheets[sheetName];
    const json = xlsx.utils.sheet_to_json(sheet, { header: 1 });
    json.forEach((row, i) => {
      if (i < 50) {
        console.log(`Row ${i}:`, JSON.stringify(row));
      }
    });
    if (json.length >= 50) {
      console.log(`... and ${json.length - 50} more rows`);
    }
  });
}

async function inspectDOCX(filePath) {
  console.log(`\n================== DOCX: ${filePath} ==================`);
  const result = await mammoth.extractRawText({ path: filePath });
  console.log(result.value.substring(0, 10000));
  if (result.value.length > 10000) {
    console.log(`\n... truncated, total length: ${result.value.length}`);
  }
}

async function inspectPDF(filePath) {
  console.log(`\n================== PDF: ${filePath} ==================`);
  const dataBuffer = fs.readFileSync(filePath);
  const data = await pdf(dataBuffer);
  console.log(`Number of pages: ${data.numpages}`);
  console.log(data.text.substring(0, 10000));
  if (data.text.length > 10000) {
    console.log(`\n... truncated, total length: ${data.text.length}`);
  }
}

async function main() {
  try {
    await inspectXLSX('docs/NOVAWEAR_Master_Brand_Repository/NOVAWEAR_Master_Brand_Repository/05_Product_Catalogue_and_Campaigns.xlsx');
    await inspectXLSX('docs/Integrix_AI_Executable_Rulebook_Schema_v0.1 (1).xlsx');
  } catch (e) {
    console.error(e);
  }
}

main();

