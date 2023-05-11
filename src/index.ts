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
  name?: string;
  permissionOnly?: boolean;
  referenceURL?: string;
  description?: string;
  accessLevel?: string;
  resourceTypes?: ActionResourceType[];
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

// const getAPIReferenceURL = (html): string => {
//   const url = html.querySelectorAll('#main-col-body a[href]:contains("API operations available for")');

//   return url[0].textContent;
// }

const getServicePrefix = (html): string => {
  const servicePrefix = html.querySelectorAll('#main-col-body > p:contains("service prefix:") > code[class*="code"]');

  return servicePrefix[0].textContent;
}

const getActions = (html): Action[] => {
  const actionTableRows = html.querySelectorAll(':contains("Actions defined by") ~ div[class*="table-container"] table > tr');

  // const actions: Action[] = actionTableRows.map(tr => ({
  //   name: tr.childNodes[1].textContent.trim(),
  //   permissionOnly: true,
  //   description: tr.childNodes[3].textContent.trim(),
  //   accessLevel: tr.childNodes[4].textContent.trim(),
  //   resourceTypes: [],
  //   //referenceURL: tr.childNodes[1].childNodes[3].attributes['href'],
  //   // arnPattern: tr.childNodes[3].textContent.trim(),
  //   // conditionKeys: tr.childNodes[5].textContent.trim().length !== 0 ? tr.childNodes[5].textContent.trim().split('\n') : [],
  // }));

  let nextActionRow: number | undefined;
  let nextDescriptionRow: number | undefined;
  //let action: Action | undefined;
  let actions: Action[] = [];

  for (let rowNum = 0; rowNum < actionTableRows.length; rowNum++) {
    const rowNode = actionTableRows[rowNum];
    const rowCellNodes = rowNode.querySelectorAll('td');
    let action: Action | undefined;

    if (!action || rowNum === nextActionRow) {
      // Init action
      action = {};

      if (rowCellNodes.length !== 6) {
        console.log(`Row ${rowNum}: Cell number expected as 6 but found ${rowCellNodes.length}`);
        console.log(rowCellNodes.toString())
      }

      let actionRowSpan = 1;
      const rowSpanValue: number | undefined = rowCellNodes[0].attributes['rowspan'];

      if (rowSpanValue) {
        actionRowSpan = rowSpanValue;
      }

      nextActionRow = rowNum + actionRowSpan;
			nextDescriptionRow = rowNum;

			const actionNameRaw = rowCellNodes[0].textContent;
			const actionNameSubstrings = actionNameRaw.split(' ');

      // Get action name
      const actionNameNode: HTMLElement | undefined = rowCellNodes[0].querySelector('a[href]');

      if (actionNameNode) {
        action.name = actionNameNode.textContent || '';
        action.referenceURL = actionNameNode.attributes['href'];
      } else {
        action.name = actionNameSubstrings[0];
      }

      // Permission only check
      if (actionNameRaw.indexOf('[permission only]') > -1) {
        action.permissionOnly = true;
      } else {
        action.permissionOnly = false;
      }

      action.resourceTypes = [];
    }

    // if (rowNum === nextDescriptionRow) {
    //   const descriptionRowSpan = 1;
    //   const descriptionCellNode = rowCellNodes[rowCellNodes.length-5];
    //   const currentRowSpanValue: number | undefined = descriptionCellNode.attributes['rowspan'];

    //   if (currentRowSpanValue) {
    //     nextDescriptionRow = currentRowSpanValue;
    //   }

    //   nextDescriptionRow = rowNum + descriptionRowSpan;

    //   if (action.description) {
    //     rowNum = (nextActionRow || 1) - 1;
    //     continue;
    //   }

    //   action.description = descriptionCellNode.textContent;

    //   const accessLevelNode = rowCellNodes[rowCellNodes.length-4];
    //   action.accessLevel = accessLevelNode.textContent;

    // }

    actions.push(action);
    action = {};
  }

  console.log(actions)
    // const cells = actionTableRows[1].querySelectorAll('td');
    // const rowSpan = !!cells[0].attributes['rowspan'];
    // //console.log(tr.toString())
    // console.log(!!cells[0].attributes['rowspan']);
    // console.log(actionTableRows[1].childNodes.length)


  return []//actions;
}

const getResourceTypes = (html): ResourceType[] => {
  const resourceTypeTableRows = html.querySelectorAll(':contains("Resource types defined by") + p + div[class*="table-container"] table > tr');

  const resourceTypes: ResourceType[] = resourceTypeTableRows.map(tr => ({
    name: tr.childNodes[1].textContent.trim(),
    referenceURL: tr.childNodes[1].childNodes[3].attributes['href'],
    arnPattern: tr.childNodes[3].textContent.trim(),
    conditionKeys: tr.childNodes[5].textContent.trim().length !== 0 ? tr.childNodes[5].textContent.trim().split('\n') : [],
  }));

  return resourceTypes;
}

const getConditionKeys = (html): ConditionKey[] => {
  const conditionKeyTableRows = html.querySelectorAll(':contains("Condition keys for") + p + p + div[class*="table-container"] table > tr');
  
  const conditionKeys: ConditionKey[] = conditionKeyTableRows.map(tr => ({
    name: tr.childNodes[1].textContent.trim(),
    referenceURL: tr.childNodes[1].childNodes[3].attributes['href'],
    description: tr.childNodes[3].textContent.trim(),
    type: tr.childNodes[5].textContent.trim(),
  }));

  return conditionKeys;
}

const getTopicPage = async (topic: Topic) => {
  // Download topic HTML
  const html = await downloadAsHTML(topic.url);

  // const u = getAPIReferenceURL(html);
  // console.log(u)

  const sp = getServicePrefix(html);
  //console.log(sp)

  const a = getActions(html);
  //console.log(a[1])

  const rt = getResourceTypes(html);
  //console.log(rt)

  const c = getConditionKeys(html);
  //console.log(c)

}

const startPage = 'https://docs.aws.amazon.com/service-authorization/latest/reference/reference_policies_actions-resources-contextkeys.html';
const testActionsPage = 'https://docs.aws.amazon.com/service-authorization/latest/reference/list_amazonec2.html';

const run = async () => {
  const html = await downloadAsHTML(startPage);

  const topics = getTopics(html);
  //console.log(topics)

  await getTopicPage(topics[0]);
};

run();
