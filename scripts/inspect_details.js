const fs = require('fs');
const xlsx = require('xlsx');
const mammoth = require('mammoth');
const { PDFParse } = require('pdf-parse');

async function extractPdfText(path) {
  const p = new PDFParse({ data: fs.readFileSync(path) });
  const res = await p.getText();
  return res.text;
}

async function main() {
  console.log('====================================');
  console.log('1. INTEGRIX RULEBOOK SCHEMA - ALL SHEETS');
  console.log('====================================');
  const wbRulebook = xlsx.readFile('docs/Integrix_AI_Executable_Rulebook_Schema_v0.1 (1).xlsx');
  wbRulebook.SheetNames.forEach(name => {
    console.log(`\n--- Sheet: ${name} ---`);
    const data = xlsx.utils.sheet_to_json(wbRulebook.Sheets[name], { header: 1 });
    data.forEach((r, idx) => console.log(`Row ${idx}:`, JSON.stringify(r)));
  });

  console.log('\n====================================');
  console.log('2. EXPECTED AUDIT RESULTS DOCX');
  console.log('====================================');
  const expAudit = await mammoth.extractRawText({ path: 'docs/NOVAWEAR_Expected_Audit_Results_v0.1 (1).docx' });
  console.log(expAudit.value);

  console.log('\n====================================');
  console.log('3. GENERATED POLICY PROFILE DRAFT DOCX');
  console.log('====================================');
  const genProf = await mammoth.extractRawText({ path: 'docs/NOVAWEAR_Generated_Policy_Profile_Draft.docx' });
  console.log(genProf.value);

  console.log('\n====================================');
  console.log('4. UNIVERSAL POLICY DOCUMENT TEMPLATE DOCX');
  console.log('====================================');
  const univTpl = await mammoth.extractRawText({ path: 'docs/Integrix_AI_Universal_Policy_Document_Template.docx' });
  console.log(univTpl.value);

  console.log('\n====================================');
  console.log('5. SAMPLE AD TEST PACK PDF');
  console.log('====================================');
  const testPackPdf = await extractPdfText('docs/NOVAWEAR_Sample_Advertisement_Test_Pack_v0.1.pdf');
  console.log(testPackPdf);

  console.log('\n====================================');
  console.log('6. BRAND REPOSITORY REPO PDFs');
  console.log('====================================');
  const repoFiles = [
    '01_Brand_Guidelines.pdf',
    '02_Company_Profile.pdf',
    '03_Marketing_and_Communication_Policy.pdf',
    '04_Product_and_Customer_Information_Policy.pdf'
  ];
  for (const f of repoFiles) {
    console.log(`\n--- PDF: ${f} ---`);
    const txt = await extractPdfText(`docs/NOVAWEAR_Master_Brand_Repository/NOVAWEAR_Master_Brand_Repository/${f}`);
    console.log(txt);
  }
}

main().catch(console.error);
