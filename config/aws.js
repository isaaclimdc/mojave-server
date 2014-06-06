var S3_KEY = 'AKIAJT2CO6BMAEPJHGKA';
var S3_SECRET = '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';
// var S3_BUCKET = 'b1.mojavebucket';

module.exports = function(AWS) {
  // TODO: Use envirnment variables instead!!
  AWS.config.update({ accessKeyId: S3_KEY, secretAccessKey: S3_SECRET });
  AWS.config.update({region: 'us-west-1'});
};
