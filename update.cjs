const fs = require('fs');
const path = 'src/pages/AdminPortal.tsx';
let content = fs.readFileSync(path, 'utf8');

const layoutStartIndex = content.indexOf('    return (\\n        <div className=\"min-h-screen');
const overviewEndIndex = content.indexOf('                        </div>\\n                    )}\\n\\n                    {activeTab === \\'applications\\' && (');

if (layoutStartIndex === -1 || overviewEndIndex === -1) {
    console.error('Markers not found!');
    process.exit(1);
}

const newLayoutChunk = fs.readFileSync('new_chunk.txt', 'utf8');
content = content.replace(content.substring(layoutStartIndex, overviewEndIndex), newLayoutChunk);

// Icons
const requiredIcons = ['ArrowRight', 'CreditCard', 'Settings', 'Megaphone', 'Mail', 'CalendarDays', 'FolderOpen', 'CheckSquare', 'Moon', 'PlusCircle', 'Briefcase', 'Award'];
for (const icon of requiredIcons) {
    if (!content.includes(icon) || !content.substring(0, 500).includes(icon)) {
        content = content.replace('Award,', 'Award, ' + icon + ',');
    }
}


fs.writeFileSync(path, content, 'utf8');
console.log('Success replaces content!');
