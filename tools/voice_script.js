// Prints every spoken line as  id<TAB>text  (run: node tools/voice_script.js > tools/voice_script.tsv)
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const ctx = {};
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'data.js'), 'utf8') + '\nthis.TEXT = TEXT;', ctx);
for (const [id, text] of Object.entries(ctx.TEXT)) process.stdout.write(id + '\t' + text + '\n');
