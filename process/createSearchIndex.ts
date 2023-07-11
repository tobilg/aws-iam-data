import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import lunr from 'lunr';
import { AWSIamData, ServiceAuthReference } from '../src/index';

interface SearchIndexEntryAll {
  id: number;
  serviceName: string;
  serviceDocsUrl?: string;
  entryType: 'service' | 'action' | 'resourceType' | 'conditionKey';
  servicePrefix: string;
  actionName?: string;
  actionDescription?: string;
  actionAccessLevel?: string;
  actionIsPermissionOnly?: boolean;
  actionResourceTypes?: (string | undefined)[];
  resourceTypeName?: string;
  resourceTypeArnPattern?: string;
  resourceTypeDocsUrl?: string;
  conditionKeyName?: string;
  conditionKeyDescription?: string;
  conditionKeyType?: string;
  conditionKeyDocsUrl?: string;
}

interface SearchIndexEntrySmall {
  id: number;
  serviceName: string;
  serviceDocsUrl?: string;
  entryType: 'service' | 'action' | 'resourceType' | 'conditionKey';
  servicePrefix: string;
  actionName?: string;
  actionDescription?: string;
  actionAccessLevel?: string;
  actionIsPermissionOnly?: boolean;
  resourceTypeName?: string;
  resourceTypeArnPattern?: string;
  resourceTypeDocsUrl?: string;
  conditionKeyName?: string;
  conditionKeyDescription?: string;
  conditionKeyType?: string;
  conditionKeyDocsUrl?: string;
}

const iamDataRaw = readFileSync(join(__dirname, '../data/json', 'iam.json'), { encoding: 'utf-8' });
const iamData = JSON.parse(iamDataRaw) as AWSIamData;

let id = 0;

const preFlattenedData: SearchIndexEntryAll[][] = iamData.map(service => {
  // Create entries array
  const entries: SearchIndexEntryAll[] = [];

  // Add service
  entries.push({
    id: id,
    entryType: 'service',
    serviceName: service.name,
    serviceDocsUrl: service.authReferenceUrl,
    servicePrefix: service.servicePrefix,
  });

  id++;

  // Add actions
  service.actions.forEach(action => {
    entries.push({
      id: id,
      entryType: 'action',
      serviceName: service.name,
      serviceDocsUrl: service.authReferenceUrl,
      servicePrefix: service.servicePrefix,
      actionName: action.name,
      actionDescription: action.description,
      actionAccessLevel: action.accessLevel,
      actionIsPermissionOnly: action.permissionOnly,
      actionResourceTypes: action.resourceTypes?.filter(resourceType => resourceType.resourceType).map(resourceType => resourceType.resourceType),
    });

    id++;
  });

  // Add resource types
  service.resourceTypes.forEach(resourceType => {
    entries.push({
      id: id,
      entryType: 'resourceType',
      serviceName: service.name,
      serviceDocsUrl: service.authReferenceUrl,
      servicePrefix: service.servicePrefix,
      resourceTypeName: resourceType.name,
      resourceTypeArnPattern: resourceType.arnPattern,
      resourceTypeDocsUrl: resourceType.apiReferenceUrl,
    });

    id++;
  });

  // Add condition keys
  service.conditionKeys.forEach(conditionKey => {
    entries.push({
      id: id,
      entryType: 'conditionKey',
      serviceName: service.name,
      serviceDocsUrl: service.authReferenceUrl,
      servicePrefix: service.servicePrefix,
      conditionKeyName: conditionKey.name,
      conditionKeyDescription: conditionKey.description,
      conditionKeyDocsUrl: conditionKey.apiReferenceUrl,
      conditionKeyType: conditionKey.type,
    });

    id++;
  });

  return entries;
});

//console.log(JSON.stringify(entries, null, 2));

const searchIndexAll = lunr(function () {
 
  this.ref('id');
  this.field('serviceName');
  this.field('serviceDocsUrl');
  this.field('entryType');
  this.field('servicePrefix');
  this.field('actionName');
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

console.log(JSON.stringify(searchIndexAll.search("serviceName:'AWS Lambda' +create"), null, 2));

//console.log(JSON.stringify(searchIndex));

writeFileSync(join(__dirname, '../data/json', 'searchIndexAll.json'), JSON.stringify(searchIndexAll), { encoding: 'utf-8' });
