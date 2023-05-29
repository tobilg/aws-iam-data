import { AWSIamData, Changelog, ChangelogEntry, ServiceAuthReference } from '../src/awsIamData';
import oldVersion from '../data/iam.old.json';
import newVersion from '../data/iam.json';
import { readFileSync, writeFileSync } from 'fs';

// Store changes
let hasChanges = false;

// Setup changelog
let changelog: ChangelogEntry = {
  dateOfChange: new Date().toISOString().substring(0, 10),
  addedServices: [],
  removedServices: [],
  addedActions: {},
  removedActions: {}
}

const sortChangelogEntries = (a, b) => {
  if (a.dateOfChange < b.dateOfChange) {
    return 1;
  }
  if (a.dateOfChange > b.dateOfChange){ 
    return -1;
  }
  return 0;
}

const compareStringArrays = (oldArray: string[], newArray: string[]) => {
  let removed = oldArray.filter(x => !newArray.includes(x));
  let added = newArray.filter(x => !oldArray.includes(x));

  return { added, removed };
}

const compareServiceActions = (oldService: ServiceAuthReference, newService: ServiceAuthReference) => {
  return compareStringArrays(
    oldService.actions.filter(action => action.name.length > 0).map(action => action.name),
    newService.actions.filter(action => action.name.length > 0).map(action => action.name)
  );
}

const findService = (serviceArray: ServiceAuthReference[], serviceName: string): ServiceAuthReference | null => {
  const foundServiceArray = serviceArray.filter(service => service.name === serviceName);
  if (foundServiceArray.length === 1) {
    return foundServiceArray[0];
  } else {
    return null;
  }
}

// Cast AWSIamData
const oldAWSIamData = (oldVersion as AWSIamData);
const newAWSIamData = (newVersion as AWSIamData);

// Get services
const oldServices = oldAWSIamData.map(service => service.name);
const newServices = newAWSIamData.map(service => service.name);

// Get service differences
const { added: addedServices, removed: removedServices } = compareStringArrays(oldServices, newServices);

// Add to changelog entry
changelog = {
  ...changelog,
  addedServices,
  removedServices,
}

// Iterate through new services list
newAWSIamData.forEach(service => {
  // Get service name
  const serviceName = service.name;
  // Find old service version
  const oldServiceVersion = findService(oldAWSIamData, serviceName);

  // If old version is found, check for changes
  if (oldServiceVersion) {
    // Compare actions
    const { added: addedActions, removed: removedActions } = compareServiceActions(oldServiceVersion, service);

    // Check for added actions
    if (addedActions.length > 0) {
      // There are changes
      hasChanges = true;

      // Check if service is already in the map, otherwise create it
      if (!changelog.addedActions.hasOwnProperty(serviceName)) {
        changelog.addedActions[serviceName] = [];
      }

      // Add added actions
      changelog.addedActions[serviceName] = changelog.addedActions[serviceName].concat(addedActions.map(action => `${service.servicePrefix}:${action}`));
    }

    // Check for removed actions
    if (removedActions.length > 0) {
      // There are changes
      hasChanges = true;
      
      // Check if service is already in the map, otherwise create it
      if (!changelog.removedActions.hasOwnProperty(serviceName)) {
        changelog.removedActions[serviceName] = [];
      }

      // Add added actions
      changelog.removedActions[serviceName] = changelog.removedActions[serviceName].concat(removedActions.map(action => `${service.servicePrefix}:${action}`));
    }
  }
});

// Add new service's actions as well
if (addedServices) {
  // There are changes
  hasChanges = true;

  addedServices.forEach(serviceName => {
    // Find new service version
    const newServiceVersion = findService(newAWSIamData, serviceName);
    const actions = newServiceVersion?.actions.filter(action => action.name.length > 0).map(action => action.name) || [];

    // Check for added actions
    if (actions.length > 0) {
      // Check if service is already in the map, otherwise create it
      if (!changelog.addedActions.hasOwnProperty(serviceName)) {
        changelog.addedActions[serviceName] = [];
      }

      // Add added actions
      changelog.addedActions[serviceName] = changelog.addedActions[serviceName].concat(actions.map(action => `${newServiceVersion?.servicePrefix}:${action}`));
    }
  })
}

// Add removed old service's actions as well
if (removedServices) {
  // There are changes
  hasChanges = true;

  removedServices.forEach(serviceName => {
    // Find new service version
    const oldServiceVersion = findService(oldAWSIamData, serviceName);
    const oldActions = oldServiceVersion?.actions.filter(action => action.name.length > 0).map(action => action.name) || [];

    // Check for added actions
    if (oldActions.length > 0) {
      // Check if service is already in the map, otherwise create it
      if (!changelog.removedActions.hasOwnProperty(serviceName)) {
        changelog.removedActions[serviceName] = [];
      }

      // Add added actions
      changelog.removedActions[serviceName] = changelog.removedActions[serviceName].concat(oldActions.map(action => `${oldServiceVersion?.servicePrefix}:${action}`));
    }
  })
}

if (hasChanges) {
  // Read from current changelog file
  let currentChangelog = JSON.parse(readFileSync('./data/changelog.json', { encoding: 'utf-8'})) as Changelog;

  // Add changelog entry to changelog
  currentChangelog.push(changelog);

  // Sort descending by dateOfChange 
  currentChangelog = currentChangelog.sort(sortChangelogEntries);

  // Write new changelog
  writeFileSync('./data/changelog.json', JSON.stringify(currentChangelog, null, 2), { encoding: 'utf-8'});
} else {
  console.log('No changes detected');
}
