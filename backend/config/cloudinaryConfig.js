const cloudinary = require('cloudinary').v2;

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dn7a3a8ej',
    api_key: process.env.CLOUDINARY_API_KEY || '186421941754384',
    api_secret: process.env.CLOUDINARY_API_SECRET || '8IiOn0GSuNxPaZCGG1tEsk6prjE',
    timeout: 60000
});

module.exports = cloudinary;