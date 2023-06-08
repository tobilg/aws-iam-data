import axios from 'axios';
import { parse } from 'node-html-parser';

export const downloadAsHTML = async (url: string) => {
  try {
    const response = await axios.get(url);
    return (parse(response.data) as unknown as HTMLElement);
  } catch (error) {
    console.error(error);
  }
}
