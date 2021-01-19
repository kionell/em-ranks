const nodeosu = require('node-osu');
const api = new nodeosu.Api(process.env.OSU);

const fs = require('fs');

const results = {
  "English": [],
  "Español": [],
  "Русский": [],
  "Português": [],
  "Français": [],
  "Deutsch": [],
  "Polski": [],
  "汉语": [],
  "漢語": [],
  "日本語": [],
  "한국어": []
};

processEntries();

async function processEntries()
{
  const positions = require('./positions.json');
  const table = fs.readFileSync('./content.txt', 'utf8');
  const entries = table.split('\r\n');

  for (let i = 0; i < entries.length; ++i) {
    let responses = entries[i].split('	');
    let entryLang = responses[1];
  
    // Entry must have selected language
    if (entryLang) {
      // Take link, gamemode and ranks from the splitted row
      // based on selected language.
      let profileLink = responses[positions[entryLang].link];
      let gamemode = responses[positions[entryLang].mode];
      let rankRange = responses[positions[entryLang].rank];
      
      try {
        // We need to validate link before using it.
        // Only bancho links are allowed.
        if (validateLink(profileLink)) {
          // Create api request config and try to get user data.
          let config = createConfig(profileLink, gamemode);
          let user = await api.getUser(config);
          
          // Get a new rank range based on user data.
          rankRange = getRankRange(+user.pp.rank);

          // Save row with updated rank range.
          for (const lang in results) {
            results[lang].push(lang === entryLang ? rankRange : '');
          }
        }
      }
      catch (err) {
        // If link was wrong or user wasn't found.
        console.log(`${profileLink} (at row ${i + 2})`);
        
        // Save row without any changes in ranks.
        for (const lang in results) {
          results[lang].push(lang === entryLang ? rankRange : '');
        }

        continue;
      }
    }
    else {
      // Row doesn't have any selected language.
      // Fill it with empty cells.
      for (const lang in results) {
        results[lang].push('');
      }
    }
  }

  // Write files for each language.
  for (const lang in results) {
    fs.writeFileSync(`${lang}.txt`, results[lang].join('\r\n'));
  }
}

function getRankRange(rank)
{
  if (rank >= 200001) return '200001+';
  if (rank >= 100001 && rank < 200001) return '100001-200000';
  if (rank >= 75001 && rank < 100001) return '75001-100000';
  if (rank >= 50001 && rank < 75001) return '50001-75000';
  if (rank >= 25001 && rank < 50001) return '25001-50000';
  if (rank >= 10001 && rank < 25001) return '10001-25000';
  if (rank >= 5001 && rank < 10001) return '5001-10000';
  if (rank >= 1001 && rank < 5001) return '1001-5000';
  if (rank >= 101 && rank < 1001) return '101-1000';
  if (rank >= 1 && rank < 101) return '1-100';
}

function createConfig(profileLink, gamemode)
{
  let linkArgs = profileLink
    .replace(/(http|https):\/\//, '')
    .split('/')
    .filter(x => x);

  // Idk how, but sometimes links can have game mode in it.
  // Example: https://osu.ppy.sh/users/9628870#osu
  let user = linkArgs[2].split('#')[0];
  let mode = 0;

  switch (gamemode) {
    case 'osu!taiko':
      mode = 1;
      break;

    case 'osu!catch':
      mode = 2;
      break;

    case 'osu!mania':
      mode = 3;
  }

  return {
    u: user,
    m: mode
  };
}

function validateLink(link)
{
  link = link
    .replace(/(http|https):\/\//, '')
    .split('/')
    .filter(x => x);

  if (link.length <= 2) {
    throw new Error('Link must contain at least 3 args');
  }

  if (!/^(old|osu).ppy.sh$/.test(link[0])) {
    throw new Error('Link must start with old or new osu domain');
  }

  if (!/^(u|users)$/.test(link[1])) {
    throw new Error(
      'Second arg of the link must indicate that this is a user link'
    );
  }

  return true;
}