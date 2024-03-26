const { S3Client } = require('@aws-sdk/client-s3');
const multer = require('multer');
const multerS3 = require('multer-s3');
const shortId = require('shortid');
const aws = require('../config/aws.config');
require('dotenv').config();
const fileFilter = (req, file, cb) => {
 
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    return cb(new Error('Invalid file type'));
  }
  cb(null, true);
};
let s3 = new S3Client({
  region: aws.region,
  credentials: {
    accessKeyId: process.env.accessKeyId,
    secretAccessKey: process.env.secretAccessKey,
  },
  sslEnabled: false,
  s3ForcePathStyle: true,
  signatureVersion: 'v4',
});
const uploadStorage = multer({
  storage: multerS3({
    s3: s3,
    bucket: aws.bucket,
    contentType: multerS3.AUTO_CONTENT_TYPE,
    acl: 'public-read',
    metadata: function (req, file, cb) {
      cb(null, { fieldName: file.fieldname });
    },
    key: function (req, file, cb) {
      cb(null, 'temp/patentDocument_' + shortId.generate() + '-' + Date.now() + '.pdf');
    },
  }), fileFilter: fileFilter,
});
module.exports = uploadStorage;