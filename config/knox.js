var S3_KEY = 'AKIAJT2CO6BMAEPJHGKA';  // TODO: Put these elsewhere?
var S3_SECRET = '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';
var S3_BUCKET = 'b1.mojavebucket';

module.exports = function(knox) {
  knox.createClient({
    key: S3_KEY,
    secret: S3_SECRET,
    bucket: S3_BUCKET
  })
};
