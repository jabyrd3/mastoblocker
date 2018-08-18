const request = require('request');
const Nightmare = require('nightmare');

function fetchAndParse () {
  // im sorry for this function,
  // it is late and i've been shitposting hard all day
  const data = [];
  return new Promise((res, rej) => {
    request.get('https://raw.githubusercontent.com/dzuk-mutant/blockchain/master/list/list.md')
      .on('error', e =>
        console.log('uhoh, something went wrong fetching the blocklist', e))
      .on('response', r => {
        r.on('data', d=>data.push(d.toString()))
        r.on('end', () =>
          res(data
            .join('')
            .split('\n')
            .filter(l => [
              //find lines with these regexes
              /\- \[/g,
              /\* \[\*\*/g,
              /\- \*\*/g].some(pat => pat.test(l)))
            .map(l =>
                l.match(/\*\*(.*?)\*\*/)[0])
            // can't be a domain if no dot!
            .filter(l => l.indexOf('.') !== -1)
            // filter lines with space character (pawoo.net entry has one
            // after parents, for example)
            .filter(l => l.indexOf(' ') === -1)
            .map(l =>
                l.slice(2, -2))
            .filter(l => 
                l[0] !== '@')
            ))})
  });
}

// sorry to have to use this, but phantomjs sucks toots and
// mastodon doesn't provide an api to get domain blocks easily

const nightmare = Nightmare({
  // show: true,
  // openDevTools: {
  //   mode: 'detach'
  // },
});

function crawlPage (page) {
  return new Promise((res, rej) => {
    nightmare
      .goto(page)   
      .evaluate(dernt =>
        dernt(null,
          [].slice
            .call(document.querySelectorAll('.domain samp'))
            .map(i => i.innerText)))
      .then(l => res(l))
      .catch(e => console.log(e) || rej(e));
  });
} 

async function navToDomainBlocks () {
  const list = [];
  let page = 0;
  return new Promise((res, rej) => {
    nightmare
      .goto(`${process.env.MASTO_URL}/auth/sign_in`)
      .type('#user_email', process.env.MASTO_EMAIL)
      .type('#user_password', process.env.MASTO_PASSWORD)
      .click('.actions .btn[type="submit"]')
      .wait(2000)
      .goto(`${process.env.MASTO_URL}/admin/domain_blocks`)
      .wait(2000)
      .evaluate(dernt =>
        dernt(null, [
          [].slice
            .call(document.querySelectorAll('.domain samp'))
            .map(i => i.innerText),
          [].slice
            .call(document.querySelectorAll('.pagination .page a'))
            .map(a => a.href)
        ]))
      .then(arr => {
        // console.log(arr[0])
        const pages = arr[1];
        const full =
          pages.map(async p => {
            const list = await crawlPage(p);
            return list;
          });
        Promise
          .all(full)
          .then(l => res(arr[0].concat(l.reduce((acc, val) => acc.concat(val) ,[]))))
            
      })
      .catch(e=>{
        console.log('something went wrong; did you enter your credentials properly? Is your instance up?')
      });
  });
};

function addBlocks (all, existing) {
  all
    // difference between existing and full block list
    .filter(x => !existing.includes(x))
    // dedupe after filter
    .filter((elem, pos, arr) => arr.indexOf(elem) == pos)
    // async controlflow stuff; nightmare has 1 queue
    .reduce(function(accumulator, target, idx, arr) {
      // actually doing the blocks
      console.log(`performing domain block ${idx} / ${arr.length}: ${target}`);
      return accumulator.then(function(results) {
        return nightmare
          .wait(1000)
          .goto(`${process.env.MASTO_URL}/admin/domain_blocks`)
          .wait('.content h2')
          .wait(20)
          .click('.content .button')
          .wait(20)
          .wait('#domain_block_severity')
          .wait(20)
          .type('#domain_block_domain', target)
          .wait(20)
          .select('#domain_block_severity', "suspend")
          .wait(1000)
          .click('.domain_block_reject_media div.label_input label')
          .wait(500)
          .click('.content .actions button')
          .then(function(result){
            results.push(result);
            return results;
          })
          .catch(e => console.log('Something went wrong! Is your instance healthy? Do you have admin credentials entered?'));
      });
    }, Promise.resolve([])).then(function(results){
        console.log('DING, ALL DONE!');
        console.log('- if some instances don\'t seem blocked, read the manual');
        console.log('- you can always run the script again, too!');
        nightmare.end();
        process.exit();
    });
};

async function fire(){
  const list = await fetchAndParse();
  const ilr = await navToDomainBlocks();
  addBlocks.apply(null, [list, ilr]);
}

fire();
