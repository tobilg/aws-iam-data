import { downloadAsHTML } from './utils/downloader';
import { join } from 'path';
import { writeFileSync } from 'fs';
import { Topic, Action, ActionResourceType, ConditionKey, ResourceType, ServiceAuthReference, AWSIamMetadata } from '../src/index';

const getTopics = (root: HTMLElement): Topic[] => {
  // Get topics
  const topicNodes = root?.querySelectorAll('#main-col-body > div.highlights > ul > li > p > a');

  // Extract topic data
  const topics: Topic[] = Array.from(topicNodes).map(topicNode => ({
      name: topicNode.textContent?.trim().replace(/\s+\([^)]+\)$/, '') || '',
      authReferenceUrl: `https://docs.aws.amazon.com/service-authorization/latest/reference/${topicNode.attributes['href'].replace(/\.\//g, '')}`,
    })
  );

  return topics;
}

const getServicePrefix = (html: HTMLElement): string => {
  // Get service prefix
  const servicePrefix = html.querySelectorAll('#main-col-body > p:contains("service prefix:") > code[class*="code"]');

  return servicePrefix[0].textContent || '';
}

const getDependentActionsByActionName = (html: HTMLElement): Map<string, string[]> => {
  const operationTableRows = html.querySelectorAll('h2[id$="-operations"] + p + div[class*="table-container"] table > tr');
  const dependentActionsByActionName = new Map<string, string[]>();
  let operationName = '';
  let authorizedActions: string[] = [];

  const storeDependentActions = () => {
    if (!operationName) {
      return;
    }

    const primaryAction = authorizedActions.find(actionName => actionName.endsWith(`:${operationName}`));
    if (primaryAction) {
      dependentActionsByActionName.set(operationName, authorizedActions.filter(actionName => actionName !== primaryAction));
    }
  };

  for (const rowNode of operationTableRows) {
    const rowCellNodes = rowNode.querySelectorAll('td');
    let authorizedActionCell: Element | undefined;

    if (rowCellNodes.length === 5) {
      storeDependentActions();
      operationName = rowCellNodes[0].textContent?.trim() || '';
      authorizedActions = [];
      authorizedActionCell = rowCellNodes[1];
    } else if (operationName && rowCellNodes.length === 4) {
      authorizedActionCell = rowCellNodes[0];
    }

    const authorizedAction = authorizedActionCell?.textContent?.trim();
    if (authorizedAction) {
      authorizedActions.push(authorizedAction);
    }
  }

  storeDependentActions();
  return dependentActionsByActionName;
};

const getActionResourceType = (resourceTypeCell: Element, conditionKeysCell: Element, dependentActions: string[]): ActionResourceType => {
  const resourceTypeField = resourceTypeCell.textContent?.trim() || '';
  const conditionKeyNodes = conditionKeysCell.querySelectorAll('p');

  return {
    resourceType: resourceTypeField.replace('*', ''),
    required: resourceTypeField.indexOf('*') > -1,
    conditionKeys: Array.from(conditionKeyNodes).map(conditionKeyNode => conditionKeyNode.textContent?.trim() || '').filter(conditionKey => conditionKey.length > 0),
    dependentActions: [...dependentActions],
  };
};

const getActions = (html: HTMLElement): Action[] => {
  const actionTableRows = html.querySelectorAll('h2[id$="-actions-as-permissions"] + p + div[class*="table-container"] table > tr');
  const dependentActionsByActionName = getDependentActionsByActionName(html);
  const actions: Action[] = [];
  let action: Action | undefined;

  for (const rowNode of actionTableRows) {
    const rowCellNodes = rowNode.querySelectorAll('td');

    if (rowCellNodes.length === 5) {
      if (action) {
        actions.push(action);
      }

      const actionNameRaw = rowCellNodes[0].textContent?.trim() || '';
      const actionNameNode: Element | null = rowCellNodes[0].querySelector('a[href]');
      const actionName = actionNameNode?.textContent?.trim() || actionNameRaw.split(' ')[0] || '';
      const dependentActions = dependentActionsByActionName.get(actionName) || [];

      action = {
        name: actionName,
        permissionOnly: actionNameRaw.indexOf('[permission only]') > -1,
        description: rowCellNodes[1].textContent || '',
        accessLevel: rowCellNodes[4].textContent || '',
        resourceTypes: [getActionResourceType(rowCellNodes[2], rowCellNodes[3], dependentActions)],
      };

      if (actionNameNode) {
        action.apiReferenceUrl = actionNameNode.attributes['href'].toString();
      }
    } else if (action && rowCellNodes.length === 2) {
      const dependentActions = dependentActionsByActionName.get(action.name) || [];
      const resourceType = getActionResourceType(rowCellNodes[0], rowCellNodes[1], dependentActions);

      if (resourceType.resourceType?.indexOf('\n') === -1) {
        action.resourceTypes?.push(resourceType);
      }
    }
  }

  if (action) {
    actions.push(action);
  }

  return actions;
}

const getResourceTypes = (html: HTMLElement): ResourceType[] => {
  // Get resource types table rows
  const resourceTypeTableRows = html.querySelectorAll('h2[id$="-resources-for-iam-policies"] + p + div[class*="table-container"] table > tr');

  // Parse resource types
  const resourceTypes: ResourceType[] = Array.from(resourceTypeTableRows).map(tr => ({
    name: tr.childNodes[1].textContent?.trim() || '',
    apiReferenceUrl: tr.childNodes[1].childNodes[1]?.attributes['href'].toString() || '',
    arnPattern: tr.childNodes[3].textContent?.trim() || '',
    conditionKeys: tr.childNodes[5].textContent?.trim().length !== 0 ? tr.childNodes[5].textContent?.trim().split('\n').map(item => item.trim()).filter(item => item.length > 0) : [],
  }));

  return resourceTypes;
}

const getConditionKeys = (html: HTMLElement): ConditionKey[] => {
  // Get condition table rows
  const conditionKeyTableRows = html.querySelectorAll('h2[id$="-policy-keys"] + p + div[class*="table-container"] table > tr');
  
  // Parse condition keys
  const conditionKeys: ConditionKey[] = Array.from(conditionKeyTableRows).map(tr => ({
    name: tr.childNodes[1].textContent?.trim() || '',
    apiReferenceUrl: tr.childNodes[1].childNodes[1]?.attributes['href'].toString() || '',
    description: tr.childNodes[3].textContent?.trim() || '',
    type: tr.childNodes[5].textContent?.trim() || '',
  }));

  return conditionKeys;
}

const getTopicPage = async (topic: Topic): Promise<ServiceAuthReference> => {
  // Download topic HTML
  const html = await downloadAsHTML(topic.authReferenceUrl) as unknown as HTMLElement;

  // Extract and combine data
  const serviceAuthReference: ServiceAuthReference = {
    ...topic,
    servicePrefix: getServicePrefix(html),
    actions: getActions(html),
    resourceTypes: getResourceTypes(html),
    conditionKeys: getConditionKeys(html),
  }

  return serviceAuthReference;
}

// Start page for parsing
const startPage = 'https://docs.aws.amazon.com/service-authorization/latest/reference/reference_policies_actions-resources-contextkeys.html';

// List of deprecated services / topics
const topicBlacklist: string[] = ['AWS IoT 1-Click'];

const run = async () => {
  // Get start page
  const html = await downloadAsHTML(startPage);

  if (html) {
    // Parse topics
    const topics = getTopics(html);

    const serviceAuthReferenceData: ServiceAuthReference[] = await Promise.all(topics.filter(topic => !topicBlacklist.includes(topic.name)).map(async topic => {
      console.log(`Gathering data for ${topic.name}`);
      const topicPageResult = await getTopicPage(topic);
      return topicPageResult;
    }));

    const gatheredDataCounts = {
      services: serviceAuthReferenceData.length,
      actions: serviceAuthReferenceData.reduce((count, service) => count + service.actions.length, 0),
      resourceTypes: serviceAuthReferenceData.reduce((count, service) => count + service.resourceTypes.length, 0),
      conditionKeys: serviceAuthReferenceData.reduce((count, service) => count + service.conditionKeys.length, 0),
    };

    if (!gatheredDataCounts.services || !gatheredDataCounts.actions || !gatheredDataCounts.resourceTypes || !gatheredDataCounts.conditionKeys) {
      throw new Error(`AWS IAM data gather returned an empty required collection: ${JSON.stringify(gatheredDataCounts)}`);
    }

    // Write IAM data
    writeFileSync(join(__dirname, '../data/json', 'iam.json'), JSON.stringify(serviceAuthReferenceData, null, 2), { encoding: 'utf-8' });

    // Gather metadata
    const metadata: AWSIamMetadata = {
      serviceCount: serviceAuthReferenceData.length,
      services: serviceAuthReferenceData.map(service => ({
        name: service.name,
        servicePrefix: service.servicePrefix,
        authReferenceUrl: service.authReferenceUrl,
        actionsCount: service.actions.length,
        actions: service.actions.filter(action => action.name).map(action => action.name) as string[],
        resourceTypesCount: service.resourceTypes.length,
        resourceTypes: service.resourceTypes.filter(resourceType => resourceType.name).map(resourceType => resourceType.name) as string[],
        conditionKeysCount: service.conditionKeys.length,
        conditionKeys: service.conditionKeys.filter(conditionKey => conditionKey.name).map(conditionKey => conditionKey.name) as string[],
      }))
    }

    // Write metadata
    writeFileSync(join(__dirname, '../data/json', 'metadata.json'), JSON.stringify(metadata, null, 2), { encoding: 'utf-8' });
  }
};

run();
