# Knowledge search examples

Run all cases or select one by fixture name.

```sh
npm run check:knowledge
npm run check:knowledge -- ranking.repeated-keyword
```

The 52 cases check evidence retrieval against the catalogue bundled with Insomnia. Coverage includes all seven topics, multi-topic ranking, tie order, case and punctuation normalization, short tokens, and queries without matches.

Each case declares a `scenario`, a `query`, and the ordered `expectedTopics`. Cases that test scoring can add `expectedScores`. A distinct normalized word can earn three points from tags and two from the title. Repeating the word keeps the same score. Equal scores preserve catalogue order.

Title and tag comparisons allow substrings, so a broader match can appear below the primary topic. For example, `access control` also finds customer-controlled deployment. These checks exercise the bundled catalogue and ranker. The catalogue's recorded review date is in `src/lib/knowledge.ts`.
