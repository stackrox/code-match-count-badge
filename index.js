import express from 'express';
import { makeBadge, ValidationError } from 'badge-maker'
import fetch from 'node-fetch'

const app = express();

const PORT = process.env.PORT || 9000;
const BADGE_LABEL = process.env.BADGE_LABEL || 'counter'
const SOURCEGRAPH_QUERY = process.env.SOURCEGRAPH_QUERY

if (!SOURCEGRAPH_QUERY) {
    console.error("SOURCEGRAPH_QUERY env variable is not set.")
    process.exit(1);
}

app.get('/', async function (req, res) {
    const matchCount = await fetchMatchCount()
    const format = {
        label: BADGE_LABEL,
        message: matchCount ? `${matchCount}` : 'n/a',
        color: 'blue'
    };

    const svg = makeBadge(format);
    
    res.set('Content-Type', 'image/svg+xml');
    res.status(200).send(svg);
});

app.listen(PORT, function () {
    console.log('Server is running on port:', PORT);
});

async function fetchMatchCount() {
    return await fetch('https://sourcegraph.com/.api/graphql', {
      method: 'POST',
  
      headers: {
        "Content-Type": "application/json"
      },
  
      body: JSON.stringify({
        query: `
            query ($query: String!) {
                search(query: $query, version: V2) {
                    results {
                        matchCount
                    }
                }
            }
        `,
        variables: {
            query: SOURCEGRAPH_QUERY
        }
      })
    })
    .then(x => x.json())
    .then(x => x.data.search.results.matchCount)
    .catch(err => console.log("Unable to fetch match count: ", err));
}