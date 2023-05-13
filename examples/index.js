const { iamData, metadata } = require('../src/index');

// Get overall service count
console.log(`Contains ${metadata.serviceCount} services!`);

// Get EC2 data
const ec2IamData = iamData.filter(service => service.name === 'Amazon EC2')[0];

// Get actions and their access level
const ec2Actions = ec2IamData.actions.map(action => ({ name: action.name, accessLevel: action.accessLevel }));
console.log(JSON.stringify(ec2Actions, null, 2));

// Get EC2 resource types
const ec2ResourceTypes = ec2IamData.resourceTypes.map(action => ({ name: action.name, arnPattern: action.arnPattern }));
console.log(JSON.stringify(ec2ResourceTypes, null, 2));
