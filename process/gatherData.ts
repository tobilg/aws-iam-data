import { downloadAsHTML } from './utils/downloader';
import { join } from 'path';
import { writeFileSync } from 'fs';
import { Topic, Action, ActionResourceType, ConditionKey, ResourceType, ServiceAuthReference, AWSIamMetadata } from '../src/awsIamData';

const getTopics = (root: HTMLElement): Topic[] => {
  // Get topics
  const topicNodes = root?.querySelectorAll('#main-col-body > div.highlights > ul > li > a');

  // Extract topic data
  const topics: Topic[] = Array.from(topicNodes).map(topicNode => ({
      name: topicNode.textContent?.trim() || '',
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

const getActions = (html: HTMLElement): Action[] => {
  // Get actions table
  const actionTableRows = html.querySelectorAll(':contains("Actions defined by") ~ div[class*="table-container"] table > tr');
  
  // Store actions
  let actions: Action[] = [];
  // Action placeholder
  let action: Action | undefined;
  // Store next action row
  let nextActionRow: number | undefined = 1;

  // Iterate over table rows
  for (let rowNum = 0; rowNum < actionTableRows.length; rowNum++) {
    // Get row
    const rowNode = actionTableRows[rowNum];
    // Get cells
    const rowCellNodes = rowNode.querySelectorAll('td');

    // Check if new action or next action according to rowspan
    if (!action || (rowNum === nextActionRow)) {
      // Init action
      action = {
        name: ''
      };

      // Check row cell count / rowspan
      if (rowCellNodes.length !== 6) {
        // Go to next row
        continue;
      }

      // Set default action rowspan
      let actionRowSpan = 1;
      
      // Get rowspan
      const rowSpanValue: number | undefined = rowCellNodes[0]?.attributes['rowspan'] ? parseInt(rowCellNodes[0].attributes['rowspan']) : undefined;

      if (rowSpanValue) {
        actionRowSpan = rowSpanValue;
      }

      // Set next action row
      nextActionRow = rowNum + actionRowSpan;

      // Get raw action name from first cell
			const actionNameRaw = rowCellNodes[0].textContent;
      // Split action name to determine if permission only (later)
			const actionNameSubstrings = actionNameRaw?.split(' ');
      // Get action name
      const actionNameNode: Element | null = rowCellNodes[0].querySelector('a[href]');

      // Check if action name exists with URL included
      if (actionNameNode) {
        action.name = actionNameNode.textContent || '';
        action.apiReferenceUrl = actionNameNode.attributes['href'].toString();
      } else { // Otherwise just use the raw action name
        action.name = actionNameSubstrings && actionNameSubstrings[0] || '';
      }

      // Permission only check
      if (actionNameRaw && actionNameRaw.indexOf('[permission only]') > -1) {
        action.permissionOnly = true;
      } else {
        action.permissionOnly = false;
      }

      const descriptionCellNode = rowCellNodes[rowCellNodes.length-5];
      action.description = descriptionCellNode?.textContent || '';

      const accessLevelNode = rowCellNodes[rowCellNodes.length-4];
      action.accessLevel = accessLevelNode?.textContent || '';

      // Create resource types array
      action.resourceTypes = [];

      // Setup resource type
      let resourceType: ActionResourceType = {};

      const resourceTypeField = rowCellNodes[rowCellNodes.length-3]?.textContent?.trim();
      resourceType.resourceType = resourceTypeField?.replace('*', '');
      resourceType.required = resourceTypeField && resourceTypeField?.indexOf('*') > -1 || false;

      const conditionKeyNodes = rowCellNodes[rowCellNodes.length-2].querySelectorAll('p');
      resourceType.conditionKeys = Array.from(conditionKeyNodes).map(conditionKeyNode => conditionKeyNode.textContent?.trim() || '').filter(conditionKeyNode => conditionKeyNode.length > 0);

      const dependentActionNodes = rowCellNodes[rowCellNodes.length-1].querySelectorAll('p');
      resourceType.dependentActions = Array.from(dependentActionNodes).map(dependentActionNode => dependentActionNode.textContent?.trim() || '').filter(dependentActionNode => dependentActionNode.length > 0);

      action.resourceTypes.push(resourceType);

    } else {
      // Setup resource type
      let resourceType: ActionResourceType = {};

      // Get resource type
      const resourceTypeField = rowCellNodes[rowCellNodes.length-3]?.textContent?.trim() || '';
      resourceType.resourceType = resourceTypeField.replace('*', '');
      resourceType.required = resourceTypeField.indexOf('*') > -1;

      // get condition keys
      const conditionKeyNodes = rowCellNodes[rowCellNodes.length-2].querySelectorAll('p');
      resourceType.conditionKeys = Array.from(conditionKeyNodes).map(conditionKeyNode => conditionKeyNode.textContent?.trim() || '').filter(conditionKeyNode => conditionKeyNode.length > 0);

      // Get dependant actions
      const dependentActionNodes = rowCellNodes[rowCellNodes.length-1].querySelectorAll('p');
      resourceType.dependentActions = Array.from(dependentActionNodes).map(dependentActionNode => dependentActionNode.textContent?.trim() || '').filter(dependentActionNode => dependentActionNode.length > 0);

      // Add only valid resource types
      if (action.resourceTypes && resourceType.resourceType?.indexOf('\n') === -1/*&& resourceType.resourceType !== ''*/) {
        action.resourceTypes.push(resourceType);
      }
    }

    // Check if next row is a new action, if so flush action
    if (rowNum === nextActionRow -1) {
      // Add to finalized actions
      actions.push({ ...action });

      // Reset action
      action = undefined;
    }
  }

  return actions;
}

const getResourceTypes = (html: HTMLElement): ResourceType[] => {
  // Get resource types table rows
  const resourceTypeTableRows = html.querySelectorAll(':contains("Resource types defined by") + p + div[class*="table-container"] table > tr');

  // Parse resource types
  const resourceTypes: ResourceType[] = Array.from(resourceTypeTableRows).map(tr => ({
    name: tr.childNodes[1].textContent?.trim() || '',
    apiReferenceUrl: tr.childNodes[1].childNodes[3]?.attributes['href'].toString(),
    arnPattern: tr.childNodes[3].textContent?.trim() || '',
    conditionKeys: tr.childNodes[5].textContent?.trim().length !== 0 ? tr.childNodes[5].textContent?.trim().split('\n').map(item => item.trim()).filter(item => item.length > 0) : [],
  }));

  return resourceTypes;
}

const getConditionKeys = (html: HTMLElement): ConditionKey[] => {
  // Get condition table rows
  const conditionKeyTableRows = html.querySelectorAll(':contains("Condition keys for") + p + p + div[class*="table-container"] table > tr');
  
  // Parse condition keys
  const conditionKeys: ConditionKey[] = Array.from(conditionKeyTableRows).map(tr => ({
    name: tr.childNodes[1].textContent?.trim() || '',
    apiReferenceUrl: tr.childNodes[1].childNodes[3]?.attributes['href'].toString() || '',
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

const run = async () => {
  // Get start page
  const html = await downloadAsHTML(startPage);

  if (html) {
    // Parse topics
    const topics = getTopics(html);

    const serviceAuthReferenceData: ServiceAuthReference[] = await Promise.all(topics.map(async topic => {
      console.log(`Gathering data for ${topic.name}`);
      const topicPageResult = await getTopicPage(topic);
      return topicPageResult;
    }));

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
