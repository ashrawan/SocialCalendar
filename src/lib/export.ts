import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import { Post } from '../types';
import copy from 'copy-to-clipboard';

export const exportPostsToExcel = (posts: Post[]) => {
  if (!posts || posts.length === 0) return;
  
  const data = posts.map(p => ({
    Date: p.date,
    Time: p.time,
    Platforms: p.platforms.join(', '),
    Content: p.content,
    Status: p.status
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Content Plan");
  XLSX.writeFile(wb, `SocialSync_Plan_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
};

export const copyPostsToClipboard = (posts: Post[]) => {
  if (!posts || posts.length === 0) return;
  
  const text = posts.map(p => {
    return `[${p.date} ${p.time}] [${p.platforms.join(', ')}] [${p.status.toUpperCase()}]\n${p.content}\n`;
  }).join('\n---\n\n');
  
  copy(text);
};
