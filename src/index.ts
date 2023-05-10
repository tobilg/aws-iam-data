import { downloadAsHTML } from './utils/downloader';

type Topic = {
  name: string;
  url: string;
}

type ResourceType = {
  name: string;
  referenceURL?: string;
  arnPattern: string;
  conditionKeys: string[];
}

type ActionResourceType = {
  resourceType: string;
  required: boolean;
  conditionKeys: string[];
  dependentActions: string[];
}

type Action = {
  name: string;
  permissionOnly: boolean;
  referenceURL?: string;
  description: string;
  accessLevel: string;
  resourceTypes: ActionResourceType[];
}

type ConditionKey = {
  name: string;
  referenceURL?: string;
  description: string;
  type: string;
}

const getTopics = (root): Topic[] => {
  const topicNodes = root?.querySelectorAll('#main-col-body > div.highlights > ul > li > a');
  const topics: Topic[] = topicNodes.map(topicNode => ({
      name: topicNode.textContent.trim(),
      url: `https://docs.aws.amazon.com/service-authorization/latest/reference/${topicNode.attributes['href'].replace(/\.\//g, '')}`,
    })
  );

  return topics;
}

const getServicePrefix = (html): string => {
  return '';
}

const getActions = (html): string => {
  return '';
}

const getResourceTypes = (html): string => {
  return '';
}

const getConditionKeys = (html): string => {
  const conditionKeyTableRows = html.querySelectorAll(':contains("Condition keys for") + p + p + div[class*="table-container"] table > tr');
  console.log(conditionKeyTableRows.length)
  
  const conditionKeys: ConditionKey[] = conditionKeyTableRows.map(tr => ({
    name: tr.querySelectorAll('td').textContent,
    // referenceURL?: string;
    // description: string;
    // type: string;
  }));

  console.log(conditionKeys)

  return '';
}

const getTopicPage = async (topic: Topic) => {
  // Download topic HTML
  const html = await downloadAsHTML(topic.url);

  getConditionKeys(html);

}

const startPage = 'https://docs.aws.amazon.com/service-authorization/latest/reference/reference_policies_actions-resources-contextkeys.html';
const testActionsPage = 'https://docs.aws.amazon.com/service-authorization/latest/reference/list_amazonec2.html';

const run = async () => {
    const html = await downloadAsHTML(startPage);

    const topics = getTopics(html);
    console.log(topics)

    await getTopicPage(topics[0])
};

run();
