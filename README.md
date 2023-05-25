# aws-iam-data
This repository provides AWS IAM data gathered from the official [AWS IAM docs](https://docs.aws.amazon.com/service-authorization/latest/reference/reference_policies_actions-resources-contextkeys.html) as a convenient npm package ([aws-iam-data](https://www.npmjs.com/package/aws-iam-data)), that can be used in other OSS projects.

The package also includes the [TypeScript interface definitions](src/awsIamData.d.ts).

## Usage
You can install [aws-iam-data](https://www.npmjs.com/package/aws-iam-data) as a dependecy to your Node/TypeScript project via 

```bash
npm i --save aws-iam-data
```

To use it in your own projects, see [examples/index.js](examples/index.js) or the code below:

```javascript
const { iamData, metadata, changelog } = require('aws-iam-data');

// Get overall service count
console.log(`Contains ${metadata.serviceCount} services!`);

// Get changelog
console.log(JSON.stringify(changelog, null, 2));

// Get EC2 data
const ec2IamData = iamData.filter(service => service.name === 'Amazon EC2')[0];

// Get actions and their access level
const ec2Actions = ec2IamData.actions.map(action => ({ name: action.name, accessLevel: action.accessLevel }));
console.log(JSON.stringify(ec2Actions, null, 2));

// Get EC2 resource types
const ec2ResourceTypes = ec2IamData.resourceTypes.map(action => ({ name: action.name, arnPattern: action.arnPattern }));
console.log(JSON.stringify(ec2ResourceTypes, null, 2));
```

## Automatic updates
The CI pipeline will check for AWS IAM docs updates everyday at 4AM UTC, and automatically publish a new patch version if updates are detected.
