import axios from 'axios';
import { parse } from 'node-html-parser';

export const downloadAsHTML = async (url: string) => {
  try {
    const response = await axios.get(url);
    //console.log(response);
    return parse(response.data);
  } catch (error) {
    console.error(error);
  }
}
