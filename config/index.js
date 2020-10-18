const Cloud = require('@google-cloud/storage');
const path = require('path');
const serviceKey = path.join(__dirname, './student-rides-d55ab5cbe0a5.json');

const { Storage } = Cloud;
const storage = new Storage({
	keyFilename: serviceKey,
	projectId: 'student-rides',
});

module.exports = storage;
