import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';

const root=fileURLToPath(new URL('../',import.meta.url));
const template=await readFile(path.join(root,'index.html'),'utf8');
const {games}=JSON.parse(await readFile(path.join(root,'games.json'),'utf8'));
const escape=value=>value.replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;').replaceAll('>','&gt;');
for(const game of games){
  const slug=game.slug||game.folder;
  if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug))throw new Error('Invalid game slug: '+slug);
  const html=template.replace('<title>Yokocho Games</title>',`<title>${escape(game.title)} · Yokocho Games</title>\n    <meta name="description" content="${escape(game.description||game.title)}">\n    <link rel="canonical" href="https://yokocho.games/${slug}/">`);
  await mkdir(path.join(root,slug),{recursive:true});
  await writeFile(path.join(root,slug,'index.html'),html);
}
console.log(`Generated ${games.length} dedicated game pages.`);
