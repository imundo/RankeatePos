const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(function(file) {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) { 
            results = results.concat(walk(file));
        } else { 
            if (file.endsWith('.ts')) {
                results.push(file);
            }
        }
    });
    return results;
}

const files = walk('frontend/pos-app/src/app');

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let original = content;

    content = content.replace(/}\)\.format\((amount|value|val|v)\);/g, "}).format($1) + ' ' + currency;");
    content = content.replace(/currency:\s*this\.tenant\(\)\?\.currency \|\| 'CLP',/g, "currency: currency,");

    // Also need to ensure `currency` variable exists if they just used `this.tenant()?.currency || 'CLP'` directly inside Intl.NumberFormat
    // Most of them already have `const currency = tenant?.currency || 'CLP';`

    if (content !== original) {
        fs.writeFileSync(file, content, 'utf8');
        console.log('Updated', file);
    }
});
