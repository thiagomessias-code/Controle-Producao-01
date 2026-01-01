
const fs = require('fs');
const path = require('path');

try {
    const dbPath = path.join(__dirname, 'client', 'db.json');
    console.log('Reading DB from:', dbPath);

    if (!fs.existsSync(dbPath)) {
        console.error('File not found!');
        process.exit(1);
    }

    const data = fs.readFileSync(dbPath, 'utf8');
    const db = JSON.parse(data);

    console.log('--- Groups (Unique Types) ---');
    if (db.groups) {
        const types = [...new Set(db.groups.map(g => g.type))];
        console.log('Types found:', types);
        console.log('Sample Group:', db.groups[0]);
    } else {
        console.log('No groups found.');
    }

    console.log('\n--- Cages (Sample) ---');
    if (db.cages) {
        console.log('Total Cages:', db.cages.length);
        console.log('Sample Cage:', db.cages[0]);
        if (db.cages[0] && db.groups) {
            const matchingGroup = db.groups.find(g => g.id === db.cages[0].groupId);
            console.log('Link Test - Cage[0] links to Group:', matchingGroup ? matchingGroup.name : 'Not Found');
        }
    } else {
        console.log('No cages found.');
    }

} catch (err) {
    console.error('Error:', err);
}
