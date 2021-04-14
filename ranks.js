(async function processEntries() {
  const nodeosu = require('node-osu');
  const api = new nodeosu.Api(process.env.OSU);
  
  const fs = require('fs');
  const path = require('path');

  const FILENAME = process.argv[2] || './content.txt';
  
  const LANG_TITLE = 'Select your language to start';

  const GAMEMODES = {
    'osu!std': 0,
    'osu!taiko': 1,
    'osu!catch': 2,
    'osu!mania': 3,
  };

  /**
   * Valid links:
   *  https://osu.ppy.sh/users/9628870
   *  https://old.ppy.sh/users/9628870
   *  https://osu.ppy.sh/u/9628870
   *  https://old.ppy.sh/u/9628870
   *  https://osu.ppy.sh/u/9628870#osu
   */
  const LINK_REGEX = new RegExp(''
    + /^((http|https):\/\/)?/.source  /* Protocol */
    + /(old|osu).ppy.sh\//.source     /* Domain */
    + /(u|users)\//.source            /* Path */
    + /[A-z0-9]+/.source              /* User ID */
    + /([#(osu|taiko|fruits|mania)]*|\/(osu|taiko|fruits|mania))$/.source /* Additions */
  );

  /**
   * Valid gamemode:
   *  osu!std
   *  osu!taiko
   *  osu!catch
   *  osu!mania
   */
  const GAMEMODE_REGEX = /^osu!(std|taiko|catch|mania)$/;

  const validateLink = (resp) => LINK_REGEX.test(resp);
  const validateGamemode = (resp) => GAMEMODE_REGEX.test(resp);

  /**
   * Converts user's rank to a rank range.
   * @param {number} rank user's rank. 
   * @returns {string} rank range string.
   */
  const getRankRange = (rank) => {
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
  
  /**
   * Converts user's profile link and gamemode to a request config.
   * @param {string} link user's profile link.
   * @param {string} mode user's gamemode.
   * @returns {object} osu api request config.
   */
  const createConfig = (link, mode) => {
    const args = link
      .replace(/(http|https):\/\//, '')
      .split('/')
      .filter(x => x);

    return {
      u: args[2].split('#')[0], 
      m: GAMEMODES[mode] || 0
    };
  }
  
  const errors = [];
  const results = {};

  const table = fs.readFileSync(path.resolve(__dirname, FILENAME), 'utf8');
  const entries = table.split('\r\n');

  /**
   * I can't really automate finding the language column in the table, 
   * so we will search for it by the hardcoded title or by a fixed index.
   */
  const titles = entries.shift().split('\t');

  const langIndex = titles.findIndex(t => t === LANG_TITLE) || 1;

  for (let i = 0; i < entries.length; ++i) {
    const responses = entries[i].split('\t').map(x => x.trim());
    const entryLang = responses[langIndex];
  
    // Entry must have a language.
    if (entryLang && entryLang.length > 0) {
      /**
       * We need to find a proper link before using this entry.
       * This script can only work with bancho links.
       */
      const profileLink = responses.find(validateLink);

      try {
        if (profileLink) {
          const gamemode = responses.find(validateGamemode);

          // Create api request config and try to get user data.
          const config = createConfig(profileLink, gamemode);
          const user = await api.getUser(config);
          
          // Get a new rank range based on user data.
          const rankRange = getRankRange(+user.pp.rank);

          if (!results[entryLang]) results[entryLang] = [];

          // Save row with updated rank range.
          results[entryLang][i] = rankRange;

          continue;
        }

        throw new Error('Missing/Wrong profile link!');
      }
      catch (err) {
        // If link was wrong or user wasn't found.
        errors.push(`Row ${i + 2}: ${profileLink || err.message}`);

        continue;
      }
    }
  }

  // Write files for each language.
  for (const lang in results) {
    if (results.hasOwnProperty(lang)) {
      fs.writeFileSync(`./output/${lang}.txt`, results[lang].join('\r\n'));
    }
  }

  if (errors.length) {
    fs.writeFileSync(`./output/errors.txt`, errors.join('\r\n'));
  }
}());
