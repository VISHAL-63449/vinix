import fs from 'fs';
try {
    let raw = fs.readFileSync('lint_output.json');
    let str = raw.toString('utf16le');
    if (str.charCodeAt(0) === 0xFEFF) {
        str = str.slice(1);
    }
    if (!str.trim().startsWith('[')) {
        str = raw.toString('utf8');
        if (str.charCodeAt(0) === 0xFEFF) {
            str = str.slice(1);
        }
    }
    const data = JSON.parse(str);
    let outputLines = [];
    data.forEach(item => {
        const errors = item.messages.filter(m => m.severity === 2);
        const warnings = item.messages.filter(m => m.severity === 1);
        if (errors.length > 0 || warnings.length > 0) {
            outputLines.push(`FILE: ${item.filePath.split(/[\\/]/).pop()}`);
            errors.forEach(e => {
                outputLines.push(`  ERROR Line ${e.line}:${e.column} - ${e.message} (${e.ruleId})`);
            });
            warnings.forEach(w => {
                outputLines.push(`  WARNING Line ${w.line}:${w.column} - ${w.message} (${w.ruleId})`);
            });
        }
    });
    fs.writeFileSync('clean_errors.txt', outputLines.join('\n'));
    console.log("Successfully wrote errors to clean_errors.txt");
} catch (err) {
    console.error(err);
}
