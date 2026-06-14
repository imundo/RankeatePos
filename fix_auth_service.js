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

    content = content.replace(/\(this\.authService \? \(this\.authService/g, "((this as any).authService ? ((this as any).authService");

    if (content !== original) {
        fs.writeFileSync(file, content, 'utf8');
        console.log('Fixed authService cast', file);
    }
});
