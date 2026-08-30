import fs from 'fs';

const data = JSON.parse(fs.readFileSync('inspect_output.json', 'utf8'));

let log = '';
log += '--- APPLICATIONS ---\n';
data.apps.forEach(app => {
    log += `Student: ${app.student_name} (${app.email})\n`;
    log += `  Domain Selected: ${app.domain}\n`;
    log += `  Internship ID (FK): ${app.internship_id}\n`;
    log += `  Status: ${app.status}\n`;
});

log += '\n--- ENROLLMENTS ---\n';
data.enrolls.forEach(e => {
    const matchingIntern = data.interns.find(i => i.id === e.internship_id);
    log += `User: ${e.user_id} -> Intern ID: ${e.internship_id} (${matchingIntern?.title} [${matchingIntern?.duration}]) | Status: ${e.status}\n`;
});

log += '\n--- OFFERS ---\n';
data.offers.forEach(o => {
    log += `Offer ID: ${o.offer_letter_id} for ${o.student_name} (${o.student_email}) | Title: ${o.internship_title} [${o.duration}] | Status: ${o.status}\n`;
});

fs.writeFileSync('detailed-inspect.txt', log, 'utf8');
console.log('done');
