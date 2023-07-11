import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import lunr from 'lunr';
import { AWSIamMetadata, SearchIndexEntry } from '../src/index';

const iamDataRaw = readFileSync(join(__dirname, '../data/json', 'metadata.json'), { encoding: 'utf-8' });
const iamData = JSON.parse(iamDataRaw) as AWSIamMetadata;

const preFlattenedData: SearchIndexEntry[][] = iamData.services.map((service, serviceIndex) => {
  // Create entries array
  const entries: SearchIndexEntry[] = [];

  // Add service
  entries.push({
    id: `s-${serviceIndex}`,
    entryType: 'service',
    serviceName: service.name,
    serviceDocsUrl: service.authReferenceUrl,
    servicePrefix: service.servicePrefix,
  });

  // Add actions
  service.actions.forEach((action, actionIndex) => {
    entries.push({
      id: `s-${serviceIndex}-a-${actionIndex}`,
      entryType: 'action',
      serviceName: service.name,
      serviceDocsUrl: service.authReferenceUrl,
      servicePrefix: service.servicePrefix,
      actionName: action.name,
      actionDescription: action.description,
      actionAccessLevel: action.accessLevel,
      actionIsPermissionOnly: action.permissionOnly,
    });
  });

  // Add resource types
  service.resourceTypes.forEach((resourceType, resourceTypeIndex) => {
    entries.push({
      id: `s-${serviceIndex}-rt-${resourceTypeIndex}`,
      entryType: 'resourceType',
      serviceName: service.name,
      serviceDocsUrl: service.authReferenceUrl,
      servicePrefix: service.servicePrefix,
      resourceTypeName: resourceType.name,
      resourceTypeArnPattern: resourceType.arnPattern,
    });
  });

  // Add condition keys
  service.conditionKeys.forEach((conditionKey, conditionKeyIndex) => {
    entries.push({
      id: `s-${serviceIndex}-ck-${conditionKeyIndex}`,
      entryType: 'conditionKey',
      serviceName: service.name,
      serviceDocsUrl: service.authReferenceUrl,
      servicePrefix: service.servicePrefix,
      conditionKeyName: conditionKey.name,
      conditionKeyDescription: conditionKey.description,
    });
  });

  return entries;
});

//console.log(JSON.stringify(entries, null, 2));

const searchIndex = lunr(function () {
 
  this.ref('id');
  this.field('serviceName', { boost: 30 });
  this.field('serviceDocsUrl');
  this.field('entryType');
  this.field('servicePrefix');
  this.field('actionName', { boost: 10 });
  this.field('actionDescription');
  this.field('actionAccessLevel');
  this.field('actionIsPermissionOnly');
  this.field('actionResourceTypes');
  this.field('resourceTypeName');
  this.field('resourceTypeArnPattern');
  this.field('resourceTypeDocsUrl');
  this.field('conditionKeyName');
  this.field('conditionKeyDescription');
  this.field('conditionKeyType');
  this.field('conditionKeyDocsUrl');
  
  preFlattenedData.flat().forEach(function (entry) {
    this.add(entry)
  }, this);
});


writeFileSync(join(__dirname, '../data/json', 'searchIndex.json'), JSON.stringify(searchIndex), { encoding: 'utf-8' });
