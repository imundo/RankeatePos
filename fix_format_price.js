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

    // First replace the broken currency variable injection for those files that didn't have `const currency`
    // Wait, the easiest way is to revert the previous change, but I didn't back it up.
    // Let's just fix it by ensuring `const currency = this.authService?.tenant()?.currency || 'CLP';` is present if `currency` is undefined.
    // Or we can just use `(this.authService?.tenant()?.currency || 'CLP')` instead of `currency` in the append string!

    // Let's replace ` + ' ' + currency;` with ` + ' ' + (this.authService ? (this.authService.tenant()?.currency || 'CLP') : 'CLP');`
    content = content.replace(/\+ ' ' \+ currency;/g, "+ ' ' + (this.authService ? (this.authService.tenant()?.currency || 'CLP') : 'CLP');");

    // Also fix `currency: currency,` if `currency` is not defined. We can replace it with `currency: this.authService ? (this.authService.tenant()?.currency || 'CLP') : 'CLP',`
    // Actually, earlier I replaced `currency: this.tenant()?.currency || 'CLP',` with `currency: currency,`.
    content = content.replace(/currency: currency,/g, "currency: (this.authService ? (this.authService.tenant()?.currency || 'CLP') : 'CLP'),");

    if (content !== original) {
        fs.writeFileSync(file, content, 'utf8');
        console.log('Fixed', file);
    }
});
